import { beforeEach, describe, expect, it, vi } from 'vitest';
import { processGitversaryImage } from '../../src/jobs/gitversary-image';
import { handleQueue } from '../../src/jobs/queue-handler';
import type { Bindings } from '../../src/types';

vi.mock('../../src/jobs/gitversary-image', () => ({
  processGitversaryImage: vi.fn(),
}));

const processGitversaryImageMock = vi.mocked(processGitversaryImage);

function createMessage(body: unknown) {
  return {
    body,
    ack: vi.fn(),
    retry: vi.fn(),
  };
}

function createEnv(): Bindings {
  return {} as Bindings;
}

describe('handleQueue', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('acknowledges a message after successfully processing it', async () => {
    const message = createMessage({ id: 'job-1', data: { username: 'octocat', years: 5 } });
    processGitversaryImageMock.mockResolvedValue(undefined);

    const env = createEnv();
    await handleQueue({ messages: [message] } as never, env);

    expect(processGitversaryImageMock).toHaveBeenCalledWith(message.body, env);
    expect(message.ack).toHaveBeenCalledOnce();
    expect(message.retry).not.toHaveBeenCalled();
  });

  it('retries a message when processing throws', async () => {
    const message = createMessage({ id: 'job-2', data: { username: 'octocat', years: 5 } });
    processGitversaryImageMock.mockRejectedValue(new Error('screenshot failed'));

    const env = createEnv();
    await handleQueue({ messages: [message] } as never, env);

    expect(message.retry).toHaveBeenCalledOnce();
    expect(message.ack).not.toHaveBeenCalled();
  });

  it('processes every message in the batch independently', async () => {
    const okMessage = createMessage({ id: 'job-ok', data: { username: 'octocat', years: 5 } });
    const failMessage = createMessage({
      id: 'job-fail',
      data: { username: 'monalisa', years: 3 },
    });

    processGitversaryImageMock.mockImplementation(async (job: never) => {
      if ((job as { id: string }).id === 'job-fail') throw new Error('boom');
    });

    const env = createEnv();
    await handleQueue({ messages: [okMessage, failMessage] } as never, env);

    expect(okMessage.ack).toHaveBeenCalledOnce();
    expect(okMessage.retry).not.toHaveBeenCalled();
    expect(failMessage.retry).toHaveBeenCalledOnce();
    expect(failMessage.ack).not.toHaveBeenCalled();
  });

  it('does nothing for an empty batch', async () => {
    const env = createEnv();

    await expect(handleQueue({ messages: [] } as never, env)).resolves.toBeUndefined();
    expect(processGitversaryImageMock).not.toHaveBeenCalled();
  });
});
