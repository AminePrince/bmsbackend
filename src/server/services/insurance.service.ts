import { db } from "../db/mockDb.js";
import { InsuranceCompany, Assistance, InsuranceLog } from "../../types.js";

export interface InsuranceProviderInterface {
  sendClaim(assistance: Assistance, company: InsuranceCompany): Promise<any>;
  checkStatus(claimId: string, company: InsuranceCompany): Promise<any>;
}

export class InsuranceIntegrationService {
  private static logRequest(companyId: number, request: any, response: any, status: string) {
    const log: InsuranceLog = {
      id: db.insuranceLogs.length + 1,
      insuranceCompanyId: companyId,
      requestPayload: JSON.stringify(request),
      responsePayload: JSON.stringify(response),
      status,
      createdAt: new Date().toISOString()
    };
    db.insuranceLogs.push(log);
  }

  static async sendAssistanceRequest(assistanceId: number) {
    const assistance = db.assistances.find(a => a.id === assistanceId);
    if (!assistance || !assistance.insuranceCompanyId) return null;

    const company = db.insuranceCompanies.find(c => c.id === assistance.insuranceCompanyId);
    if (!company) return null;

    // Simulate API call
    const requestPayload = {
      policy_number: assistance.policyNumber,
      issue: assistance.issueType,
      description: assistance.description,
      estimated_cost: assistance.estimatedCost
    };

    // Mocking response
    const responsePayload = {
      success: true,
      claim_id: `CLM-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
      status: "pending_review"
    };

    this.logRequest(company.id, requestPayload, responsePayload, "SUCCESS");

    // Update assistance
    assistance.reimbursementStatus = "pending";
    
    return responsePayload;
  }

  static async syncClaimUpdates(assistanceId: number) {
    const assistance = db.assistances.find(a => a.id === assistanceId);
    if (!assistance || !assistance.insuranceCompanyId) return null;

    const company = db.insuranceCompanies.find(c => c.id === assistance.insuranceCompanyId);
    if (!company) return null;

    // Simulate status check
    const statusUpdate = {
      status: "approved",
      amount: assistance.estimatedCost ? assistance.estimatedCost * 0.8 : 0,
      date: new Date().toISOString()
    };

    this.logRequest(company.id, { check_status: assistanceId }, statusUpdate, "SUCCESS");

    // Update assistance
    assistance.reimbursementStatus = "approved";
    assistance.reimbursementAmount = statusUpdate.amount;
    assistance.reimbursementDate = statusUpdate.date;

    return statusUpdate;
  }
}
