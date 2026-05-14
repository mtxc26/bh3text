import type { RouteLocation } from "vue-router";

export function getRouteHref(route: RouteLocation) {
    const url = new URL(route.fullPath, window.location.href);
    for (const i of Object.entries(route.query)) {
      if (!i[1]) continue;
      if (typeof i[1] === 'string') url.searchParams.append(i[0], i[1]);
      else for (const j of i[1]) if (j) url.searchParams.append(i[0], j);
    }
    url.hash = route.hash;
    return url
}
