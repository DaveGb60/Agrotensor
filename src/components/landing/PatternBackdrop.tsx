import { brand } from './brandAssets';

type Props = {
  variant?: 'light' | 'green' | 'deep';
  className?: string;
  children: React.ReactNode;
  id?: string;
};

/**
 * Full-width section wrapper that layers the AgroTensor circuit-and-leaf pattern
 * over a farm-green tinted base. `light` is for cream sections, `green` for mid,
 * `deep` for the darkest brand-green bands.
 */
const PatternBackdrop = ({ variant = 'light', className = '', children, id }: Props) => {
  const tints: Record<string, string> = {
    light:
      'linear-gradient(180deg, hsl(150 35% 97% / 0.96) 0%, hsl(150 40% 92% / 0.94) 100%)',
    green:
      'linear-gradient(180deg, hsl(150 42% 22% / 0.94) 0%, hsl(150 45% 16% / 0.97) 100%)',
    deep:
      'linear-gradient(180deg, hsl(150 55% 10% / 0.96) 0%, hsl(150 60% 7% / 0.98) 100%)',
  };

  return (
    <section
      id={id}
      className={`relative overflow-hidden ${className}`}
      style={{
        backgroundImage: `${tints[variant]}, url(${brand.bgPattern})`,
        backgroundSize: 'cover, 620px auto',
        backgroundRepeat: 'no-repeat, repeat',
        backgroundBlendMode: 'normal, luminosity',
      }}
    >
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.10]"
        style={{
          backgroundImage:
            variant === 'light'
              ? 'radial-gradient(60% 50% at 100% 0%, hsl(150 60% 35% / 0.5) 0%, transparent 70%), radial-gradient(50% 45% at 0% 100%, hsl(200 65% 40% / 0.4) 0%, transparent 70%)'
              : 'radial-gradient(60% 50% at 100% 0%, hsl(150 70% 60% / 0.5) 0%, transparent 70%), radial-gradient(50% 45% at 0% 100%, hsl(200 80% 65% / 0.4) 0%, transparent 70%)',
        }}
      />
      <div className="relative">{children}</div>
    </section>

  );
};

export default PatternBackdrop;
