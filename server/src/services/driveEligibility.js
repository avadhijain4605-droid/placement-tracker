// Deterministic eligibility check for placement drives.
// Returns { eligible: boolean, undetermined: boolean, reasons: string[] }

export function checkDriveEligibility(student, drive) {
  const criteria = drive.eligibility || {};
  const reasons = [];
  let undetermined = false;

  // CGPA check
  if (criteria.minCgpa && criteria.minCgpa > 0) {
    if (student.cgpa == null) {
      undetermined = true;
      reasons.push("Your CGPA is not set in your profile.");
    } else if (student.cgpa < criteria.minCgpa) {
      reasons.push(`Your CGPA (${student.cgpa}) is below the minimum required (${criteria.minCgpa}).`);
    }
  }

  // Graduation year check
  if (criteria.graduationYear && criteria.graduationYear.length > 0) {
    if (!student.graduationYear) {
      undetermined = true;
      reasons.push("Your graduation year is not set in your profile.");
    } else if (!criteria.graduationYear.includes(student.graduationYear)) {
      reasons.push(`Your graduation year (${student.graduationYear}) is not in the eligible years (${criteria.graduationYear.join(", ")}).`);
    }
  }

  // Branch check
  if (criteria.branches && criteria.branches.length > 0) {
    if (!student.branch) {
      undetermined = true;
      reasons.push("Your branch is not set in your profile.");
    } else {
      const match = criteria.branches.some(
        (b) => b.toLowerCase().trim() === student.branch.toLowerCase().trim()
      );
      if (!match) {
        reasons.push(`Your branch (${student.branch}) is not in the eligible branches (${criteria.branches.join(", ")}).`);
      }
    }
  }

  // Backlog check
  if (criteria.backlogAllowed === false) {
    const studentBacklogs = student.totalActiveBacklogs ?? student.backlogs;
    if (studentBacklogs == null) {
      undetermined = true;
      reasons.push("Your backlog status is not set in your profile.");
    } else if (studentBacklogs > (criteria.maxBacklogs || 0)) {
      reasons.push(`You have ${studentBacklogs} backlog(s), but this drive allows a maximum of ${criteria.maxBacklogs || 0}.`);
    }
  }

  const eligible = reasons.length === 0 && !undetermined;
  return { eligible, undetermined, reasons };
}
