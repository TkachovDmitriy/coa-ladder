import { useEffect } from "react"

const SITE_URL = "https://tkachovdmitriy.github.io/coa-ladder"

export function PrivacyPage() {
  useEffect(() => {
    const title = "Privacy & Disclaimer — CoA Arena Ladder"
    const description =
      "Privacy information and legal disclaimer for the community-run Conquest of Azeroth Arena Ladder."
    const canonicalUrl = `${SITE_URL}/privacy/`

    document.title = title
    document.querySelector('meta[name="description"]')?.setAttribute("content", description)

    let canonical = document.querySelector<HTMLLinkElement>('link[rel="canonical"]')
    if (!canonical) {
      canonical = document.createElement("link")
      canonical.rel = "canonical"
      document.head.append(canonical)
    }
    canonical.href = canonicalUrl

    document.querySelector('meta[property="og:title"]')?.setAttribute("content", title)
    document.querySelector('meta[property="og:description"]')?.setAttribute("content", description)
    document.querySelector('meta[property="og:url"]')?.setAttribute("content", canonicalUrl)
    document.querySelector('meta[name="twitter:title"]')?.setAttribute("content", title)
    document.querySelector('meta[name="twitter:description"]')?.setAttribute("content", description)

    const structuredData = document.querySelector<HTMLScriptElement>("#structured-data")
    if (structuredData) {
      structuredData.textContent = JSON.stringify({
        "@context": "https://schema.org",
        "@type": "WebPage",
        "@id": `${canonicalUrl}#webpage`,
        url: canonicalUrl,
        name: title,
        description,
        isPartOf: { "@id": `${SITE_URL}/#website` },
        inLanguage: "en",
      })
    }
  }, [])

  return (
    <article className="mx-auto max-w-3xl space-y-8 text-sm leading-6">
      <header className="space-y-2">
        <h2 className="text-2xl font-semibold tracking-tight">Privacy & Disclaimer</h2>
        <p className="text-muted-foreground">Last updated: August 23, 2026</p>
      </header>

      <section className="space-y-3">
        <h3 className="text-lg font-semibold">Privacy</h3>
        <p>
          CoA Arena Ladder is a community-run website. You can browse the ladder without creating an account or
          providing personal information directly to the site operator.
        </p>
      </section>

      <section className="space-y-3">
        <h3 className="text-lg font-semibold">Ladder data</h3>
        <p>
          Character names, ratings, match records, classes and specializations are obtained from publicly available
          Conquest of Azeroth ladder and armory sources. This information relates to in-game characters and is shown
          to provide rankings and statistics.
        </p>
      </section>

      <section className="space-y-3">
        <h3 className="text-lg font-semibold">Feedback survey</h3>
        <p>
          The optional feedback survey is provided by Tally. If you submit it, the site operator receives the answers
          and any information you choose to include. Tally processes form submissions on the operator&apos;s behalf.
          Responses are used only to evaluate and improve the site, retained only while useful for that purpose, and
          then deleted.
        </p>
        <p>
          Learn more in Tally&apos;s{" "}
          <a
            className="font-medium text-primary underline-offset-4 hover:underline"
            href="https://tally.so/help/privacy-policy"
            target="_blank"
            rel="noopener noreferrer"
          >
            privacy notice
          </a>
          .
        </p>
      </section>

      <section className="space-y-3">
        <h3 className="text-lg font-semibold">Analytics and local preferences</h3>
        <p>
          The site uses Cloudflare Web Analytics to measure aggregate traffic and performance. Cloudflare describes
          this service as cookie-free and states that it does not collect or use visitors&apos; personal data. The site
          stores your light or dark theme choice in your browser&apos;s local storage; that preference stays on your
          device.
        </p>
        <p>
          Learn more in Cloudflare&apos;s{" "}
          <a
            className="font-medium text-primary underline-offset-4 hover:underline"
            href="https://developers.cloudflare.com/web-analytics/about/"
            target="_blank"
            rel="noopener noreferrer"
          >
            Web Analytics documentation
          </a>
          .
        </p>
      </section>

      <section className="space-y-3">
        <h3 className="text-lg font-semibold">External services</h3>
        <p>
          Links to Ascension Logs, Twitch, GitHub and other third-party websites are governed by those services&apos;
          own privacy policies. Their sites may collect information when you visit them.
        </p>
      </section>

      <section className="space-y-3">
        <h3 className="text-lg font-semibold">Your choices and contact</h3>
        <p>
          You may ask to access or delete information you submitted through the feedback survey. Send a request or a
          privacy question through the project&apos;s{" "}
          <a
            className="font-medium text-primary underline-offset-4 hover:underline"
            href="https://github.com/TkachovDmitriy/coa-ladder/issues"
            target="_blank"
            rel="noopener noreferrer"
          >
            GitHub issue tracker
          </a>
          . Please do not post sensitive personal information in a public issue.
        </p>
      </section>

      <section className="space-y-3 border-t border-border/60 pt-8">
        <h3 className="text-lg font-semibold">Disclaimer</h3>
        <p>
          CoA Arena Ladder is an unofficial community project and is not affiliated with, endorsed by or operated by
          Project Ascension. Game names, marks and related assets belong to their respective owners.
        </p>
        <p>
          Ladder information may be delayed, incomplete or inaccurate. The site and its data are provided for
          informational purposes without warranties of accuracy, availability or fitness for a particular purpose.
          Use external links and rely on displayed information at your own discretion.
        </p>
      </section>
    </article>
  )
}
