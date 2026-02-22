import { CheerioCrawler } from 'crawlee';

const crawler = new CheerioCrawler({
  maxRequestsPerMinute: 60,
  async requestHandler({ request, $, enqueueLinks }) {
    const text = $('body').text();

    await enqueueLinks({
      strategy: 'same-domain',
    });
  },
});

await crawler.run(['https://anydb.com']);
