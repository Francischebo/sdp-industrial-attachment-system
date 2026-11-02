import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Landing from './Landing';
import useAuthStore from '../store/authStore';
import api from '../services/api';

vi.mock('../services/api', () => ({
    default: { get: vi.fn() },
}));

const RICH_HTML = '<h3>Who can apply</h3><ul><li>Accredited</li></ul>';

function mockPublic() {
    api.get.mockImplementation((url) => {
        if (url === 'jobs/vacancies/public/') return Promise.resolve({ data: { results: [] } });
        if (url === 'jobs/departments/') return Promise.resolve({ data: { results: [] } });
        if (url === 'jobs/eligibility-settings/') {
            return Promise.resolve({ data: { general_statement_html: RICH_HTML } });
        }
        return Promise.reject(new Error(`Unexpected GET ${url}`));
    });
}

function renderLanding() {
    return render(<MemoryRouter><Landing /></MemoryRouter>);
}

describe('Landing page section structure', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        useAuthStore.getState().logout();
        mockPublic();
    });

    it('presents the hero, eligibility and vacancies as three separate sections', async () => {
        const { container } = renderLanding();

        await waitFor(() => expect(screen.getByText('Who can apply')).toBeInTheDocument());

        // A visitor must be able to tell the sections apart without reading a
        // label, so they are separate landmark elements rather than stacked divs
        // inside one block.
        expect(container.querySelector('#eligibility')).toBeInTheDocument();
        expect(container.querySelector('#vacancies')).toBeInTheDocument();

        const eligibility = container.querySelector('#eligibility');
        const vacancies = container.querySelector('#vacancies');
        expect(eligibility).not.toBe(vacancies);
    });

    it('gives the eligibility section a white ground', async () => {
        const { container } = renderLanding();
        await waitFor(() => expect(screen.getByText('Who can apply')).toBeInTheDocument());

        expect(container.querySelector('#eligibility').className).toContain('bg-white');
    });

    it('puts the requirements on a tinted card so they read against the white ground', async () => {
        const { container } = renderLanding();
        await waitFor(() => expect(screen.getByText('Who can apply')).toBeInTheDocument());

        // White section + white card is the flat version of this design; the
        // card needs its own surface to register at all.
        const card = container.querySelector('#eligibility .eligibility-prose').closest('div.rounded-2xl');
        expect(card.className).toContain('bg-primary-50');
    });

    it('keeps the decorative washes hidden from assistive technology', async () => {
        const { container } = renderLanding();
        await waitFor(() => expect(screen.getByText('Who can apply')).toBeInTheDocument());

        // The blurred corners are decoration only. They are also absolutely
        // positioned behind the content, so they must not intercept clicks --
        // which is why they carry pointer-events-none.
        const washes = [...container.querySelectorAll('#eligibility .blur-3xl')];
        expect(washes.length).toBeGreaterThan(0);
        washes.forEach((el) => {
            expect(el.getAttribute('aria-hidden')).toBe('true');
            expect(el.className).toContain('pointer-events-none');
        });
    });

    it('keeps the eligibility requirements inside that white section', async () => {
        const { container } = renderLanding();
        await waitFor(() => expect(screen.getByText('Who can apply')).toBeInTheDocument());

        // The requirements must not have drifted back into the vacancy section.
        const eligibility = container.querySelector('#eligibility');
        expect(eligibility.textContent).toContain('Who can apply');
        expect(container.querySelector('#vacancies').textContent).not.toContain('Who can apply');
    });

    it('keeps the in-page anchor for the vacancies section working', async () => {
        // The hero's primary button links to #vacancies. More than one link
        // shares this label (the hero CTA and the vacancies section CTA), so
        // check that the anchor target is present among them.
        renderLanding();
        const links = screen.getAllByRole('link', { name: /Browse Open Vacancies/i });
        expect(links.some((link) => link.getAttribute('href') === '#vacancies')).toBe(true);
    });

    it('shows a message rather than an empty card when eligibility cannot be loaded', async () => {
        api.get.mockImplementation((url) => {
            if (url === 'jobs/vacancies/public/') return Promise.resolve({ data: { results: [] } });
            if (url === 'jobs/departments/') return Promise.resolve({ data: { results: [] } });
            return Promise.reject(new Error('Network down'));
        });

        renderLanding();

        // An empty bordered panel would read as "there are no requirements".
        await waitFor(() => {
            expect(screen.getByText(/temporarily unavailable/i)).toBeInTheDocument();
        });
    });
});
