
import { 
  TravelRequest, 
  RequestStatus, 
  RequestType, 
  Role, 
  Urgency,
  User,
  Comment,
  UserProfile,
  Reimbursement,
  ReimbursementStatus,
  ReimbursementCategory
} from '../types';

// ==========================================
// --- Data Storage (In-Memory Database) ---
// ==========================================

// Initial System Users (Minimal Seed)
const INITIAL_USERS: User[] = [
  { id: 'admin', name: '系统管理员', email: 'admin', role: Role.ADMIN },
  { id: 'u1', name: '王员工', email: 'user@corp.com', role: Role.USER },
];

// Initial Profiles (Corresponding to Users)
const INITIAL_PROFILES: Record<string, UserProfile> = {
  'u1': {
    chineseName: '王员工',
    englishName: 'Wang Employee',
    nationality: '中国大陆',
    gender: '男',
    birthday: '1990-01-01',
    birthPlace: '北京',
    phone: '13800000000',
    email: 'user@corp.com',
    documents: [],
    contacts: []
  },
};

// Mutable Data Containers
// Future updates should interact with these containers or reset them here.
let db_users: User[] = [...INITIAL_USERS];
let db_profiles: Record<string, UserProfile> = { ...INITIAL_PROFILES };
let db_requests: TravelRequest[] = []; // Started Empty
let db_reimbursements: Reimbursement[] = []; // Separate storage for reimbursements

// ==========================================
// --- Service Logic ---
// ==========================================

export const mockService = {
  login: async (identifier: string, password?: string): Promise<User | null> => {
    // Admin check
    if (identifier === 'admin') {
      if (password === '12345678910') {
        return db_users.find(u => u.id === 'admin') || null;
      } else {
        return null; 
      }
    }
    // Normal user check
    return db_users.find(u => u.email === identifier) || null;
  },

  register: async (name: string, email: string): Promise<User> => {
    if (db_users.find(u => u.email === email)) {
      throw new Error("邮箱已被注册");
    }
    const newUser: User = {
      id: `u${Date.now()}`,
      name,
      email,
      role: Role.USER
    };
    db_users.push(newUser);
    // Initialize empty profile
    db_profiles[newUser.id] = {
      chineseName: name,
      englishName: '',
      nationality: '中国大陆',
      gender: '男',
      birthday: '',
      birthPlace: '',
      phone: '',
      email: email,
      documents: [],
      contacts: []
    };
    return newUser;
  },

  getUserProfile: async (userId: string): Promise<UserProfile> => {
    await new Promise(resolve => setTimeout(resolve, 300));
    return db_profiles[userId] || {
      chineseName: '',
      englishName: '',
      nationality: '',
      gender: '男',
      birthday: '',
      birthPlace: '',
      phone: '',
      email: '',
      documents: [],
      contacts: []
    };
  },

  updateUserProfile: async (userId: string, profile: UserProfile): Promise<void> => {
    await new Promise(resolve => setTimeout(resolve, 300));
    db_profiles[userId] = profile;
  },

  getRequests: async (user?: User): Promise<TravelRequest[]> => {
    await new Promise(resolve => setTimeout(resolve, 300));
    if (user?.role === Role.ADMIN) {
      return [...db_requests].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
    return db_requests.filter(r => r.userId === user?.id).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  getRequestById: async (id: string): Promise<TravelRequest | undefined> => {
    await new Promise(resolve => setTimeout(resolve, 200));
    return db_requests.find(r => r.id === id);
  },

  createRequest: async (user: User, type: RequestType, data: any): Promise<TravelRequest> => {
    const newReq: TravelRequest = {
      id: `REQ-${new Date().getFullYear()}${String(new Date().getMonth()+1).padStart(2,'0')}${String(new Date().getDate()).padStart(2,'0')}-${Math.floor(Math.random() * 10000)}`,
      userId: user.id,
      userName: user.name,
      type,
      status: RequestStatus.SUBMITTED,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      data,
      comments: [],
      history: [{
        id: Math.random().toString(36).substr(2, 9),
        action: 'CREATED',
        actor: user.name,
        timestamp: new Date().toISOString()
      }]
    };
    db_requests.unshift(newReq);
    return newReq;
  },

  updateStatus: async (reqId: string, status: RequestStatus, user: User, note?: string): Promise<TravelRequest> => {
    const reqIndex = db_requests.findIndex(r => r.id === reqId);
    if (reqIndex === -1) throw new Error("Request not found");

    const updatedReq = { ...db_requests[reqIndex] };
    updatedReq.status = status;
    updatedReq.updatedAt = new Date().toISOString();
    
    // Assign if admin picks it up
    if (status === RequestStatus.ACCEPTED && user.role === Role.ADMIN && !updatedReq.assignedTo) {
      updatedReq.assignedTo = user.id;
    }

    updatedReq.history.push({
      id: Math.random().toString(36).substr(2, 9),
      action: `STATUS_CHANGE_TO_${status}`,
      actor: user.name,
      timestamp: new Date().toISOString(),
      details: note
    });

    db_requests[reqIndex] = updatedReq;
    return updatedReq;
  },

  addComment: async (reqId: string, user: User, content: string): Promise<Comment> => {
     const reqIndex = db_requests.findIndex(r => r.id === reqId);
     if (reqIndex === -1) throw new Error("Request not found");
     
     const newComment: Comment = {
       id: Math.random().toString(36).substr(2, 9),
       author: user.name,
       role: user.role,
       content,
       createdAt: new Date().toISOString()
     };
     
     db_requests[reqIndex].comments.push(newComment);
     return newComment;
  },

  completeBooking: async (reqId: string, user: User, resultData: any): Promise<TravelRequest> => {
    const reqIndex = db_requests.findIndex(r => r.id === reqId);
    if (reqIndex === -1) throw new Error("Request not found");

    const updatedReq = { ...db_requests[reqIndex] };
    updatedReq.status = RequestStatus.SUCCESS;
    updatedReq.updatedAt = new Date().toISOString();
    updatedReq.bookingResult = {
      ...resultData,
      files: resultData.files || [] // Use uploaded files from frontend
    };

    updatedReq.history.push({
      id: Math.random().toString(36).substr(2, 9),
      action: 'BOOKING_COMPLETED',
      actor: user.name,
      timestamp: new Date().toISOString()
    });

    db_requests[reqIndex] = updatedReq;
    return updatedReq;
  },

  updateBookingFiles: async (reqId: string, user: User, files: string[]): Promise<TravelRequest> => {
    const reqIndex = db_requests.findIndex(r => r.id === reqId);
    if (reqIndex === -1) throw new Error("Request not found");

    const updatedReq = { ...db_requests[reqIndex] };
    if (!updatedReq.bookingResult) {
        throw new Error("No booking result to update");
    }

    updatedReq.bookingResult = {
        ...updatedReq.bookingResult,
        files: files
    };
    updatedReq.updatedAt = new Date().toISOString();

    updatedReq.history.push({
      id: Math.random().toString(36).substr(2, 9),
      action: 'FILES_UPDATED',
      actor: user.name,
      timestamp: new Date().toISOString(),
      details: '管理员修改了预定附件'
    });

    db_requests[reqIndex] = updatedReq;
    return updatedReq;
  },

  failBooking: async (reqId: string, user: User, reason: string): Promise<TravelRequest> => {
    const reqIndex = db_requests.findIndex(r => r.id === reqId);
    if (reqIndex === -1) throw new Error("Request not found");

    const updatedReq = { ...db_requests[reqIndex] };
    updatedReq.status = RequestStatus.FAILED;
    updatedReq.updatedAt = new Date().toISOString();
    updatedReq.bookingResult = { failureReason: reason };

    updatedReq.history.push({
      id: Math.random().toString(36).substr(2, 9),
      action: 'BOOKING_FAILED',
      actor: user.name,
      timestamp: new Date().toISOString(),
      details: reason
    });

    db_requests[reqIndex] = updatedReq;
    return updatedReq;
  },

  deleteRequests: async (ids: string[]): Promise<void> => {
    await new Promise(resolve => setTimeout(resolve, 300));
    const idsSet = new Set(ids);
    db_requests = db_requests.filter(r => !idsSet.has(r.id));
  },

  // ==========================================
  // --- Reimbursement Service Logic ---
  // ==========================================

  getReimbursements: async (user?: User): Promise<Reimbursement[]> => {
    await new Promise(resolve => setTimeout(resolve, 300));
    if (user?.role === Role.ADMIN) {
      return [...db_reimbursements].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
    return db_reimbursements.filter(r => r.userId === user?.id).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  createReimbursement: async (user: User, data: Partial<Reimbursement>): Promise<Reimbursement> => {
     await new Promise(resolve => setTimeout(resolve, 300));
     const newReimbursement: Reimbursement = {
       id: `RMB-${new Date().getFullYear()}${String(new Date().getMonth()+1).padStart(2,'0')}-${Math.floor(Math.random() * 10000)}`,
       userId: user.id,
       userName: user.name,
       amount: data.amount || 0,
       category: data.category || ReimbursementCategory.OTHER,
       description: data.description || '',
       date: data.date || new Date().toISOString().split('T')[0],
       attachments: data.attachments || [],
       status: ReimbursementStatus.PENDING,
       createdAt: new Date().toISOString()
     };
     db_reimbursements.unshift(newReimbursement);
     return newReimbursement;
  },

  updateReimbursementStatus: async (id: string, status: ReimbursementStatus, user: User, reason?: string): Promise<Reimbursement> => {
    await new Promise(resolve => setTimeout(resolve, 300));
    const index = db_reimbursements.findIndex(r => r.id === id);
    if (index === -1) throw new Error("Reimbursement not found");

    const updated = { ...db_reimbursements[index] };
    updated.status = status;
    if (status === ReimbursementStatus.APPROVED) {
        updated.approvedBy = user.name;
    }
    if (status === ReimbursementStatus.REJECTED) {
        updated.rejectionReason = reason;
    }
    
    db_reimbursements[index] = updated;
    return updated;
  }
};
