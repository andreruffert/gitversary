import type { Bindings } from '../types';
import { processGitversaryImage } from './gitversary-image';

export async function handleQueue(batch: MessageBatch, env: Bindings) {
  for (const message of batch.messages) {
    try {
      console.debug('[processing-job]', message.body);
      const start = performance.now();

      await processGitversaryImage(message.body, env);

      const elapsed = performance.now() - start;
      console.debug(`[processing-job] ${message.body.id} → ${elapsed.toFixed(2)}ms`);

      message.ack();
    } catch (error) {
      console.error('Gitversary image job failed', {
        jobId: message.body.id,
        error,
      });

      message.retry();
    }
  }
}
