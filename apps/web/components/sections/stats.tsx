import { Container } from '@/components/ui/container';

interface Stat {
  value: string;
  label: string;
}

interface StatsProps {
  stats?: Stat[];
}

export function Stats({ stats }: StatsProps) {
  const displayStats: Stat[] = stats || [];

  if (displayStats.length === 0) return null;

  return (
    <section className="relative py-16 sm:py-20 bg-white border-y border-slate-100">
      <Container>
        <div className="grid grid-cols-2 gap-8 lg:grid-cols-4">
          {displayStats.map((stat, index) => (
            <div 
              key={index} 
              className="relative text-center group"
            >
              {/* Decorative line between items */}
              {index !== 0 && (
                <div className="absolute top-1/2 left-0 -translate-y-1/2 w-px h-12 bg-gradient-to-b from-transparent via-slate-200 to-transparent hidden lg:block" />
              )}
              
              <div className="relative">
                {/* Value with gradient */}
                <div className="text-4xl sm:text-5xl font-bold tracking-tight bg-gradient-to-br from-slate-900 to-slate-600 bg-clip-text text-transparent">
                  {stat.value}
                </div>
                
                {/* Label */}
                <div className="mt-2 text-sm font-medium text-slate-600">
                  {stat.label}
                </div>
                
                {/* Hover effect */}
                <div className="absolute -inset-4 rounded-2xl bg-gradient-to-br from-indigo-50 to-cyan-50 opacity-0 group-hover:opacity-100 transition-opacity -z-10" />
              </div>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}
