import { useContext } from 'react';
import { ApprovalContext, type ApprovalValue } from './approvalContext';

export function useApproval(): ApprovalValue {
    const v = useContext(ApprovalContext);
    if (!v) throw new Error('useApproval must be used within an ApprovalProvider');
    return v;
}
