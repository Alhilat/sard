import { api } from '@/lib/api';

export interface OrgMember {
  id: string;
  org_id: string;
  user_id?: string | null;
  name: string;
  email: string;
  role: 'مدير' | 'مشرف' | 'عضو' | string;
  status: 'active' | 'pending' | 'suspended' | string;
  created_at?: number;
}

export const orgMembersService = {
  getMembers: async (): Promise<OrgMember[]> => {
    try {
      const res = await api.get<{ success?: boolean; members?: OrgMember[]; data?: OrgMember[] }>('/org/members');
      if (Array.isArray(res)) return res;
      if (res?.members && Array.isArray(res.members)) return res.members;
      if (res?.data && Array.isArray(res.data)) return res.data;
      return [];
    } catch {
      return [];
    }
  },

  inviteMember: async (data: {
    name: string;
    email: string;
    role: string;
  }): Promise<{ success: boolean; id?: string; message?: string }> => {
    try {
      const res = await api.post<{ success: boolean; id?: string; message?: string }>('/org/members/invite', data);
      return res;
    } catch (err: any) {
      return { success: false, message: err?.message || 'تعذر إرسال الدعوة' };
    }
  },

  removeMember: async (memberId: string): Promise<{ success: boolean; message?: string }> => {
    try {
      const res = await api.delete<{ success: boolean; message?: string }>(`/org/members/${memberId}`);
      return res;
    } catch (err: any) {
      return { success: false, message: err?.message || 'تعذر حذف العضو' };
    }
  },

  updateRole: async (memberId: string, role: string): Promise<{ success: boolean; message?: string }> => {
    try {
      const res = await api.patch<{ success: boolean; message?: string }>(`/org/members/${memberId}/role`, { role });
      return res;
    } catch (err: any) {
      return { success: false, message: err?.message || 'تعذر تحديث الدور' };
    }
  },
};
