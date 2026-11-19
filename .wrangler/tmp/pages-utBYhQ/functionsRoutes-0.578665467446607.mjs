import { onRequest as __admin_api___ut___js_onRequest } from "/home/claude/akvarell-demo/functions/admin/api/[[ut]].js"
import { onRequestGet as __api_adat_js_onRequestGet } from "/home/claude/akvarell-demo/functions/api/adat.js"
import { onRequestPost as __api_ajanlat_js_onRequestPost } from "/home/claude/akvarell-demo/functions/api/ajanlat.js"
import { onRequestPost as __api_kihivas_js_onRequestPost } from "/home/claude/akvarell-demo/functions/api/kihivas.js"
import { onRequestGet as __kep__id__js_onRequestGet } from "/home/claude/akvarell-demo/functions/kep/[id].js"
import { onRequest as ___middleware_js_onRequest } from "/home/claude/akvarell-demo/functions/_middleware.js"

export const routes = [
    {
      routePath: "/admin/api/:ut*",
      mountPath: "/admin/api",
      method: "",
      middlewares: [],
      modules: [__admin_api___ut___js_onRequest],
    },
  {
      routePath: "/api/adat",
      mountPath: "/api",
      method: "GET",
      middlewares: [],
      modules: [__api_adat_js_onRequestGet],
    },
  {
      routePath: "/api/ajanlat",
      mountPath: "/api",
      method: "POST",
      middlewares: [],
      modules: [__api_ajanlat_js_onRequestPost],
    },
  {
      routePath: "/api/kihivas",
      mountPath: "/api",
      method: "POST",
      middlewares: [],
      modules: [__api_kihivas_js_onRequestPost],
    },
  {
      routePath: "/kep/:id",
      mountPath: "/kep",
      method: "GET",
      middlewares: [],
      modules: [__kep__id__js_onRequestGet],
    },
  {
      routePath: "/",
      mountPath: "/",
      method: "",
      middlewares: [___middleware_js_onRequest],
      modules: [],
    },
  ]