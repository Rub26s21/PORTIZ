'use client';

import GlowButton from './GlowButton';
import { ComponentProps } from 'react';

export default function GalaxyButton(props: ComponentProps<typeof GlowButton>) {
  return <GlowButton {...props} />;
}
