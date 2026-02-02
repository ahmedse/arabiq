// import type { Core } from '@strapi/strapi';

export default {
  /**
   * An asynchronous register function that runs before
   * your application is initialized.
   *
   * This gives you an opportunity to extend code.
   */
  register(/* { strapi }: { strapi: Core.Strapi } */) {},

  /**
   * An asynchronous bootstrap function that runs before
   * your application gets started.
   *
   * This gives you an opportunity to set up your data model,
   * run jobs, or perform some special logic.
   */
  async bootstrap({ strapi }: any) {
    // Create custom roles
    const { createCustomRoles } = await import('./bootstrap/create-roles');
    await createCustomRoles(strapi);

    // Ensure users-permissions email confirmation defaults to ON for fresh installs
    try {
      const pluginStore = strapi.store({ type: 'plugin', name: 'users-permissions' });
      const advanced = (await pluginStore.get({ key: 'advanced' })) || {};

      // Only set default when unset to avoid overriding existing installs
      if (advanced.email_confirmation === undefined) {
        advanced.email_confirmation = true;
        await pluginStore.set({ key: 'advanced', value: advanced });
        strapi.log.info('[bootstrap] Enabled users-permissions email confirmation by default');
      }
    } catch (e) {
      strapi.log.error('[bootstrap] Failed to set default email_confirmation', e);
    }

    // Optionally disable AI localizations via env var to avoid noisy errors when no AI provider is configured.
    if (process.env.DISABLE_AI_LOCALIZATIONS === 'true' || process.env.DISABLE_AI_LOCALIZATIONS === '1') {
      try {
        const i18nPlugin = strapi && typeof strapi.plugin === 'function' ? strapi.plugin('i18n') : null;

        if (i18nPlugin) {
          const aiJobs = typeof i18nPlugin.service === 'function' ? i18nPlugin.service('ai-localization-jobs') : null;
          const aiService = typeof i18nPlugin.service === 'function' ? i18nPlugin.service('ai-localizations') : null;

          if (aiJobs && typeof aiJobs.upsertJobForDocument === 'function') {
            aiJobs.upsertJobForDocument = async () => {
              strapi.log.info('[AI Localizations] disabled via DISABLE_AI_LOCALIZATIONS');
              return null;
            };
          }

          if (aiService && typeof aiService.generateDocumentLocalizations === 'function') {
            aiService.generateDocumentLocalizations = async () => {
              strapi.log.info('[AI Localizations] disabled via DISABLE_AI_LOCALIZATIONS');
              return;
            };
          }

          // Attempt to remove any existing AI job records to clean up noisy failing jobs
          try {
            const candidateUIDs = [
              'plugin::i18n.ai-localization-job',
              'plugin::i18n.ai-localization-jobs',
              'plugin::i18n.ai_localization_job',
            ];

            let cleaned = 0;
            for (const uid of candidateUIDs) {
              try {
                const res = await strapi.db.query(uid).deleteMany({ where: {} });
                // deleteMany sometimes returns number or an array; coerce to number if possible
                const count = typeof res === 'number' ? res : (res && res.length ? res.length : 0);
                if (count > 0) {
                  cleaned += count;
                  strapi.log.info(`[AI Localizations] cleaned ${count} job(s) from ${uid}`);
                  break; // stop after the first successful uid
                }
              } catch (e) {
                // uid might not exist in this Strapi distribution; ignore and try next
              }
            }

            if (cleaned === 0) {
              strapi.log.info('[AI Localizations] no job records found to clean');
            }
          } catch (err) {
            strapi.log.error('[AI Localizations] cleanup failed', err);
          }

          strapi.log.info('[AI Localizations] Disabled via DISABLE_AI_LOCALIZATIONS env var');
        } else {
          strapi.log.info('[AI Localizations] i18n plugin not found; nothing to disable');
        }
      } catch (e) {
        strapi.log.error('[AI Localizations] Failed to apply disable hook', e);
      }
    }

    // Configure public permissions for all content types (Strapi 5 compatible)
    try {
      const publicRole = await strapi
        .query('plugin::users-permissions.role')
        .findOne({ where: { type: 'public' } });

      if (!publicRole) {
        console.log('⚠️  Public role not found');
        return;
      }

      // Read-only content types (find, findOne)
      const readOnlyContentTypes = [
        'api::site-setting.site-setting',
        'api::homepage.homepage',
        'api::about-page.about-page',
        'api::contact-page.contact-page',
        'api::nav-item.nav-item',
        'api::feature.feature',
        'api::stat.stat',
        'api::process-step.process-step',
        'api::trusted-company.trusted-company',
        'api::solution.solution',
        'api::industry.industry',
        'api::case-study.case-study',
        'api::demo.demo',
        'api::faq.faq',
        'api::testimonial.testimonial',
        'api::pricing-plan.pricing-plan',
        'api::partner.partner',
        'api::pricing-page.pricing-page',
        'api::solutions-page.solutions-page',
        'api::industries-page.industries-page',
        'api::demos-page.demos-page',
        'api::case-studies-page.case-studies-page',
        'api::team-member.team-member',
        'api::value.value',
      ];

      // Content types that allow public create (e.g., contact form)
      const createOnlyContentTypes = [
        'api::contact-submission.contact-submission',
      ];

      // Get existing permissions linked to public role
      const existingPermissions = await strapi.db.query('plugin::users-permissions.permission').findMany({
        populate: ['role'],
      });
      
      const publicPermissions = existingPermissions.filter((p: any) => {
        return p.role?.id === publicRole.id || p.role === publicRole.id;
      });
      
      const existingActions = new Set(publicPermissions.map((p: any) => p.action));

      let created = 0;

      // Helper to create permission
      const createPermission = async (fullAction: string) => {
        if (!existingActions.has(fullAction)) {
          const newPerm = await strapi.db.query('plugin::users-permissions.permission').create({
            data: {
              action: fullAction,
              role: publicRole.id,
            },
          });
          
          try {
            await strapi.db.connection.raw(`
              INSERT INTO up_permissions_role_lnk (permission_id, role_id, permission_ord)
              VALUES (?, ?, 1)
              ON CONFLICT DO NOTHING
            `, [newPerm.id, publicRole.id]);
          } catch (linkErr) {
            // Link might already exist
          }
          
          created++;
          console.log(`✅ Created public permission: ${fullAction}`);
        }
      };

      // Add read permissions for read-only content
      for (const contentType of readOnlyContentTypes) {
        await createPermission(`${contentType}.find`);
        await createPermission(`${contentType}.findOne`);
      }

      // Add create permission for form submissions
      for (const contentType of createOnlyContentTypes) {
        await createPermission(`${contentType}.create`);
      }

      if (created > 0) {
        console.log(`✨ Created ${created} public permissions`);
      } else {
        console.log('✅ All public permissions already configured');
      }
    } catch (error) {
      console.error('❌ Error configuring public permissions:', error);
    }
  },
};
