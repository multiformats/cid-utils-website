import { BrowserMetricsProvider } from '@ipfs-shipyard/ignite-metrics/dist/src/BrowserMetricsProvider'

const telemetry = new BrowserMetricsProvider({ appKey: '73a50781afef72d3c29b5f0525d1b95b1a0b38bb' })

window.telemetry = telemetry;
window.removeMetricsConsent = () => telemetry.removeConsent(['minimal']);
window.addMetricsConsent = () => telemetry.addConsent(['minimal']);
