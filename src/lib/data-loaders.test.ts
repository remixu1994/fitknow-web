import { describe, expect, it } from 'vitest';

import { loadRouteData, type RouteLoader } from './data-loaders';

describe('loadRouteData', () => {
  it('returns route data from the selected loader', async () => {
    const data = await loadRouteData('foods', 'rice', {
      foods: async ({ query }) => ({ foods: [query] }),
    } as Record<string, RouteLoader>);

    expect(data).toEqual({ foods: ['rice'] });
  });

  it('returns a loadError payload when a route loader fails', async () => {
    const data = await loadRouteData('foods', '', {
      foods: async () => {
        throw new Error('missing generated json');
      },
    } as Record<string, RouteLoader>);

    expect(data.loadError).toBeInstanceOf(Error);
    expect(data.loadError?.message).toBe('missing generated json');
  });
});
