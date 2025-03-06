# Micro-Apps

## Disclaimer

This repo isn't an endorsement of micro-apps architecture, it's my answer to how I'd do it if I were told "your job is to develop and operate a micro-apps portal."

## Some references

https://docs.stripe.com/payments/quickstart

- stripe payments inserts an iframe

https://martinfowler.com/articles/micro-frontends.html

https://mbiomee.com/micro-fronends-spotify-approach-iframes-part-2-bb15c14449bf

- spotify desktop iframes

https://gmail.googleblog.com/2010/06/long-lived-new-windows.html

- gmail uses iframe

https://developers.google.com/maps/documentation/embed/get-started

- google maps embed is iframe

https://developer.spotify.com/documentation/embeds/tutorials/using-the-iframe-api

- spotify embed is iframe

https://developer.salesforce.com/docs/atlas.en-us.pages.meta/pages/pages_compref_iframe.htm

- salesforce uses iframe in some of their configurable dashboards

https://web.dev/articles/sandboxed-iframes

- google blog on safe 3rd-party iframe integration, not totally applicable since we control both domains but good overview of iframe capabilities

https://devblogs.microsoft.com/startups/building-micro-frontends-with-components/

- originally iframe based, transitioned to single UI framework (React) and design system for tighter integration benefits
  "For the development of our web platform and websites we chose [React](https://reactjs.org/). With the release of features like Hooks and Context-API, React became a great choice for us to develop modern applications from smaller, independent, and reusable pieces."

https://docs.aws.amazon.com/prescriptive-guidance/latest/micro-frontends-aws/introduction.html

- AWS's overview on micro-frontends
- Two approaches they mention
  - Single SPA framework
  - Module Federation

https://single-spa.js.org/docs/getting-started-overview

- " The main difference between a traditional SPA and single-spa applications is that they must be able to coexist with other applications as they do not each have their own HTML page."
- how hard is it- https://single-spa.js.org/docs/getting-started-overview#how-hard-will-it-be-to-use-single-spa
- migrating effort- https://single-spa.js.org/docs/migrating-existing-spas/

https://cheatsheetseries.owasp.org/cheatsheets/Third_Party_Javascript_Management_Cheat_Sheet.html#sandboxing-with-iframe

- OWASP reference for iframe

https://stackoverflow.com/questions/362730/are-iframes-considered-bad-practice

- stackoverflow
- TLDR: we tell beginners not to use iframe because they abuse them. intentionally selecting them for use cases where there's benefit in context isolation is exactly what they were designed for.
