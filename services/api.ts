
import {
    TravelRequest,
    RequestStatus,
    RequestType,
    Role,
    User,
    Comment,
    UserProfile,
    Reimbursement,
    ReimbursementStatus
} from '../types';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

const handleResponse = async (res: Response) => {
    if (!res.ok) {
        const error = await res.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(error.error || `Request failed with status ${res.status}`);
    }
    return res.json();
};

export const api = {
    login: async (identifier: string, password?: string): Promise<User | null> => {
        const res = await fetch(`${API_BASE}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ identifier, password })
        });
        if (res.status === 401) return null;
        return handleResponse(res);
    },

    register: async (name: string, email: string): Promise<User> => {
        const res = await fetch(`${API_BASE}/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email })
        });
        return handleResponse(res);
    },

    requestPasswordReset: async (identifier: string): Promise<{ success: boolean; message: string; debugCode?: string }> => {
        const res = await fetch(`${API_BASE}/forgot-password`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ identifier })
        });
        return handleResponse(res);
    },

    confirmPasswordReset: async (identifier: string, code: string, newPassword: string): Promise<{ success: boolean; message: string }> => {
        const res = await fetch(`${API_BASE}/reset-password`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ identifier, code, newPassword })
        });
        return handleResponse(res);
    },

    getUserProfile: async (userId: string): Promise<UserProfile> => {
        const res = await fetch(`${API_BASE}/users/${userId}/profile`);
        if (res.status === 404) {
            // Return defaults if not found (though backend handles 404 for user existence, 
            // for profile data it returns merged data even if empty profile).
            // But if user doesn't exist at all, handle it?
            // Backend returns 404 if user not in users table.
            throw new Error('User not found');
        }
        return handleResponse(res);
    },

    updateUserProfile: async (userId: string, profile: UserProfile): Promise<void> => {
        const res = await fetch(`${API_BASE}/users/${userId}/profile`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(profile)
        });
        return handleResponse(res);
    },

    getRequests: async (user?: User): Promise<TravelRequest[]> => {
        const url = new URL(`${API_BASE}/requests`);
        if (user) {
            url.searchParams.append('userId', user.id);
            url.searchParams.append('role', user.role);
        }
        const res = await fetch(url.toString());
        return handleResponse(res);
    },

    getRequestById: async (id: string): Promise<TravelRequest | undefined> => {
        const res = await fetch(`${API_BASE}/requests/${id}`);
        if (res.status === 404) return undefined;
        return handleResponse(res);
    },

    createRequest: async (user: User, type: RequestType, data: any): Promise<TravelRequest> => {
        const res = await fetch(`${API_BASE}/requests`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: user.id, userName: user.name, type, data })
        });
        return handleResponse(res);
    },

    updateRequestStatus: (id: string, status: RequestStatus, user: User, details?: any) => {
        return fetch(`${API_BASE}/requests/${id}/status`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                status,
                userId: user.id,
                userName: user.name,
                details
            })
        }).then(res => res.json());
    },

    updateRequest: (id: string, user: User, data: any) => {
        return fetch(`${API_BASE}/requests/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userId: user.id,
                data: data,
                travelers: data.travelers
            })
        }).then(res => res.json());
    },

    addComment: async (reqId: string, user: User, content: string): Promise<Comment> => {
        const res = await fetch(`${API_BASE}/requests/${reqId}/comments`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ author: user.name, role: user.role, content })
        });
        return handleResponse(res);
    },

    completeBooking: async (reqId: string, user: User, resultData: any): Promise<TravelRequest> => {
        const res = await fetch(`${API_BASE}/requests/${reqId}/booking`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: user.id, userName: user.name, resultData })
        });
        return handleResponse(res);
    },

    updateBookingFiles: async (reqId: string, user: User, files: string[]): Promise<TravelRequest> => {
        const res = await fetch(`${API_BASE}/requests/${reqId}/booking/files`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: user.id, userName: user.name, files })
        });
        return handleResponse(res);
    },

    failBooking: async (reqId: string, user: User, reason: string): Promise<TravelRequest> => {
        const res = await fetch(`${API_BASE}/requests/${reqId}/fail`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: user.id, userName: user.name, reason })
        });
        return handleResponse(res);
    },

    deleteRequests: async (ids: string[]): Promise<void> => {
        await fetch(`${API_BASE}/requests/delete`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ids })
        });
    },

    deleteRequest: async (id: string, userId: string): Promise<void> => {
        const res = await fetch(`${API_BASE}/requests/${id}?userId=${userId}`, {
            method: 'DELETE'
        });
        return handleResponse(res);
    },

    // --- Reimbursement Service Logic ---

    getReimbursements: async (user?: User): Promise<Reimbursement[]> => {
        const url = new URL(`${API_BASE}/reimbursements`);
        if (user) {
            url.searchParams.append('userId', user.id);
            url.searchParams.append('role', user.role);
        }
        const res = await fetch(url.toString());
        return handleResponse(res);
    },

    createReimbursement: async (user: User, data: Partial<Reimbursement>): Promise<Reimbursement> => {
        const res = await fetch(`${API_BASE}/reimbursements`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userId: user.id,
                userName: user.name,
                amount: data.amount,
                category: data.category,
                description: data.description,
                date: data.date,
                attachments: data.attachments
            })
        });
        return handleResponse(res);
    },

    updateReimbursementStatus: async (id: string, status: ReimbursementStatus, user: User, reason?: string): Promise<Reimbursement> => {
        const res = await fetch(`${API_BASE}/reimbursements/${id}/status`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status, userName: user.name, reason })
        });
        return handleResponse(res);
    },

    deleteReimbursement: async (id: string, userId: string): Promise<void> => {
        const res = await fetch(`${API_BASE}/reimbursements/${id}?userId=${userId}`, {
            method: 'DELETE'
        });
        return handleResponse(res);
    }

};
