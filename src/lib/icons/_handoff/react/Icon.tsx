import React from 'react';
import { ICONS, IconName } from './icons.data';

export interface IconProps extends React.SVGProps<SVGSVGElement> {
  name: IconName;
  size?: number | string;
  /** Apply the icon's semantic colour from the manifest. If false (default), inherits CSS `color`. Ignored for two-tone verdict glyphs, which carry their own colours. */
  semantic?: boolean;
}

/**
 * Cannabis Mythen icon. 24x24 viewBox, stroke 1.75 (verdict & feedback use 2),
 * round caps/joins. Colour comes from CSS `color` (currentColor) unless `semantic`.
 */
export function Icon({ name, size = 24, semantic = false, style, ...rest }: IconProps) {
  const def = ICONS[name];
  if (!def) { if (process.env.NODE_ENV !== 'production') console.warn('Unknown icon:', name); return null; }
  const color = semantic && def.color.startsWith('#') ? def.color : undefined;
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={def.strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={color ? { color, ...style } : style}
      aria-hidden={rest['aria-label'] ? undefined : true}
      dangerouslySetInnerHTML={{ __html: def.body }}
      {...rest}
    />
  );
}
