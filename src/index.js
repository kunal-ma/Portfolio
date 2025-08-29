import { formSubmit } from "./form.js";

export default {
    async fetch(request, env) {
        const url = new URL(request.url);

        // Route: handle form submission
        if (url.pathname === "/submit") {
            return formSubmit(request, env);
        }

        // Default: serve static assets
        return env.ASSETS.fetch(request);
    },
};
