export function safeEval(expression: string, w: number, r: number): number {
  const fns: Record<string, () => number> = {
    'w/(1-0.02*r)': () => w / (1 - 0.02 * r),
    '(r*0.0328+0.9849)*w': () => (r * 0.0328 + 0.9849) * w,
    'w/(1.0278-0.0278*r)': () => w / (1.0278 - 0.0278 * r),
    'w/(1.013-0.0267123*r)': () => w / (1.013 - 0.0267123 * r),
    'w*(r**0.1)': () => w * r ** 0.1,
    'w/(0.522+0.419*math.exp(-0.055*r))': () => w / (0.522 + 0.419 * Math.exp(-0.055 * r)),
    '0.025*w*r+w': () => 0.025 * w * r + w,
    'w/(0.488+0.538*math.exp(-0.075*r))': () => w / (0.488 + 0.538 * Math.exp(-0.075 * r)),
    '(r*0.0333)*w+w': () => r * 0.0333 * w + w,
  };
  const value = fns[expression]?.() || 0;
  return Number.isFinite(value) ? value : 0;
}
