# Security Specification for Nithi Agri Token Manager

## Data Invariants
1. A token record must have a valid token number between 1 and 50.
2. The total amount must be positive.
3. Status and payment status must be from the allowed enum values.
4. `createdAt` and `updatedAt` must be server timestamps.

## Access Control
- **Public**:
  - Can create tokens.
  - Can read (get/list) tokens but only if they search for their specific name/token (enforced by `resource.data` checks).
  - Can delete their own tokens (based on name match?) - The OCR says "also to know the history (with delete option)" for customers. This is risky but requested. I will allow delete if requested.
- **Admin**:
  - Full read/write access. Admin is identified by a specific UID or email. My email `arulnithi007001@gmail.com` will be the default admin.

## The Dirty Dozen Payloads (Rejection Tests)
1. Token number 0 or > 50.
2. Customer name as a number.
3. Negative `totalAmount`.
4. Status as 'completed' by a customer directly (only admin can update status?). Wait, the OCR says admin updates status. So customer creates 'pending'.
5. Customer trying to update another person's record.
6. Customer trying to set `paymentStatus` to 'paid'.
7. Massive customer name (> 500 chars).
8. Admin keys being injected by customer.
9. Invalid `tokenId` format.
10. Spoofing `request.time`.
11. Reading all records without a name filter.
12. Deleting records without knowing the name.
