import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { EnquiryForm } from '../src/components/EnquiryForm';

beforeEach(() => {
  vi.restoreAllMocks();
});

describe('EnquiryForm', () => {
  it('submits valid data to the API and shows a thank-you message', async () => {
    const user = userEvent.setup();
    const fetchMock = vi.fn<(input: RequestInfo, init?: RequestInit) => Promise<Response>>(
      async () =>
        ({
          ok: true,
          status: 202,
          json: async () => ({ status: 'accepted' }),
        }) as Response,
    );
    vi.stubGlobal('fetch', fetchMock);

    render(<EnquiryForm productId={1} productTitle="Red Backpack" />);

    await user.type(screen.getByLabelText(/your name/i), 'Alex Example');
    await user.type(screen.getByLabelText(/email/i), 'alex@example.com');
    await user.type(screen.getByLabelText(/message/i), 'Is it still available?');
    await user.click(screen.getByRole('button', { name: /send enquiry/i }));

    expect(await screen.findByRole('status')).toHaveTextContent(/thank you/i);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const call = fetchMock.mock.calls[0];
    if (!call) throw new Error('fetch was not called');
    const init = call[1];
    if (!init) throw new Error('fetch init missing');
    const body = JSON.parse(init.body as string);
    expect(body).toMatchObject({
      productId: 1,
      name: 'Alex Example',
      email: 'alex@example.com',
      message: 'Is it still available?',
    });
  });

  it('shows an error message when the API rejects the enquiry', async () => {
    const user = userEvent.setup();
    const fetchMock = vi.fn<(input: RequestInfo, init?: RequestInit) => Promise<Response>>(
      async () =>
        ({
          ok: false,
          status: 502,
          json: async () => ({ error: 'Could not deliver enquiry.' }),
        }) as Response,
    );
    vi.stubGlobal('fetch', fetchMock);

    render(<EnquiryForm productId={1} productTitle="Red Backpack" />);

    await user.type(screen.getByLabelText(/your name/i), 'Alex');
    await user.type(screen.getByLabelText(/email/i), 'alex@example.com');
    await user.type(screen.getByLabelText(/message/i), 'Hi');
    await user.click(screen.getByRole('button', { name: /send enquiry/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent(/could not deliver/i);
  });
});
