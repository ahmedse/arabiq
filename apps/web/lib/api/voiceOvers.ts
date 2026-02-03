/**
 * Voice-Over API Functions
 * Fetch voice-over clips from Strapi CMS
 */

import 'server-only';
import type { AudioClip, StrapiVoiceOver } from '@/lib/voiceover/types';

const STRAPI_URL = process.env.STRAPI_URL || 'http://localhost:1337';
const STRAPI_API_TOKEN = process.env.STRAPI_API_TOKEN || '';

interface StrapiResponse<T> {
  data: T[];
}

/**
 * Fetch voice-over clips for a demo
 */
export async function fetchVoiceOvers(
  demoId: number,
  locale: string
): Promise<AudioClip[]> {
  try {
    const url = `${STRAPI_URL}/api/demo-voice-overs?filters[demo][id][$eq]=${demoId}&locale=${locale}&populate=audioFile&sort=sortOrder:asc`;
    
    const res = await fetch(url, {
      headers: STRAPI_API_TOKEN 
        ? { Authorization: `Bearer ${STRAPI_API_TOKEN}` } 
        : {},
      next: { revalidate: 60 },
    });
    
    if (!res.ok) {
      console.error('[VoiceOver API] Failed to fetch:', res.status);
      return [];
    }
    
    const response: StrapiResponse<StrapiVoiceOver> = await res.json();
    
    if (!response?.data) {
      return [];
    }
    
    return response.data
      .filter((item) => item.audioFile?.url) // Must have audio file
      .map((item): AudioClip => ({
        id: item.id,
        title: item.title,
        description: item.description,
        audioUrl: item.audioFile?.url?.startsWith('http')
          ? item.audioFile.url
          : `${STRAPI_URL}${item.audioFile?.url}`,
        duration: item.duration,
        transcript: item.transcript,
        triggerType: item.triggerType,
        hotspotPosition: item.hotspotPosition,
        sweepId: undefined, // Can be added if sweep mapping is needed
        autoPlay: item.autoPlay,
        sortOrder: item.sortOrder,
        locale,
      }));
  } catch (error) {
    console.error('[VoiceOver API] Error fetching voice-overs:', error);
    return [];
  }
}

/**
 * Get the first/intro voice-over for a demo
 */
export async function fetchIntroVoiceOver(
  demoId: number,
  locale: string
): Promise<AudioClip | null> {
  const clips = await fetchVoiceOvers(demoId, locale);
  return clips.find(c => c.sortOrder === 0) || clips[0] || null;
}
