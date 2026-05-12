import { render, screen } from '@testing-library/react';
import { MockedProvider } from '@apollo/client/testing';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi } from 'vitest';
import NavBar from '../NavBar';
import { AuthContext } from '../../context/AuthContext';
import { gql } from '@apollo/client';

const PENDING_REQUESTS = gql`
  query PR {
    pending_incoming_requests {
      id
    }
  }
`;

vi.mock('react-i18next', () => ({
    useTranslation: () => ({
        t: (key) => key,
        i18n: { language: 'en', changeLanguage: vi.fn() }
    })
}));

describe('NavBar Apollo Integration', () => {
    it('displays the notification badge when pending requests exist', async () => {
        const mocks = [
            {
                request: { query: PENDING_REQUESTS },
                result: {
                    data: {
                        pending_incoming_requests: [{ id: 'req_1' }, { id: 'req_2' }]
                    }
                }
            }
        ];

        const mockAuthValue = { isLoggedIn: true, user: { username: 'TestUser' } };

        render(
            <AuthContext.Provider value={mockAuthValue}>
                <MockedProvider mocks={mocks} addTypename={false}>
                    <MemoryRouter>
                        <NavBar />
                    </MemoryRouter>
                </MockedProvider>
            </AuthContext.Provider>
        );

        const badge = await screen.findByText('2');
        expect(badge).toBeInTheDocument();
        expect(badge).toHaveClass('nav-badge');
    });
});