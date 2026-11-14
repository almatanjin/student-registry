# Database schema

This ER diagram shows the planned PostgreSQL schema that `prisma/schema.prisma` will define.
It follows the data model in `openspec/changes/build-registry-module/design.md` (decision 3).
GitHub and most Markdown previewers render the Mermaid block below as a diagram.

```mermaid
erDiagram
  User ||--o| Student : "student login"
  User ||--o{ Payment : "records (staff)"
  Programme ||--o{ Student : enrols
  Programme ||--o{ FeePlanInstalment : "fee plan"
  Programme ||--o{ Module : contains
  Student ||--o{ StudentInstalment : billed
  Student ||--o{ Payment : pays
  Module ||--o{ Assessment : has
  Assessment ||--o{ Submission : receives
  Student ||--o{ Submission : uploads
  Assessment ||--o{ Grade : "graded in"
  Student ||--o{ Grade : earns
  Student ||--o{ ModuleResult : "result state"
  Module ||--o{ ModuleResult : "per module"

  User {
    string id PK
    string email UK "lower-case"
    string passwordHash "bcrypt"
    Role role "STAFF or STUDENT"
  }
  Student {
    string id PK
    string userId FK,UK
    string studentNumber UK "SMS-2025-0001"
    string fullName
    date dateOfBirth
    string programmeId FK
    int academicYearStart "2025 = 2025/26"
    Status status "ENROLLED DEFERRED WITHDRAWN COMPLETED"
  }
  StudentNumberCounter {
    int year PK
    int lastValue
  }
  Programme {
    string id PK
    string code UK
    string name
    int annualFeeMinor "pence"
  }
  FeePlanInstalment {
    string id PK
    string programmeId FK
    int sequence
    int amountMinor
    int dueMonth
    int dueDay
  }
  StudentInstalment {
    string id PK
    string studentId FK
    int sequence
    int amountMinor
    date dueDate
  }
  Payment {
    string id PK
    string studentId FK
    int amountMinor "greater than 0"
    date paidOn
    string reference UK
    string recordedById FK
    datetime createdAt
  }
  Module {
    string id PK
    string programmeId FK
    string code UK
    string title
  }
  Assessment {
    string id PK
    string moduleId FK
    string title
    timestamptz deadline
    boolean isOpen
  }
  Submission {
    string id PK
    string assessmentId FK "unique with studentId"
    string studentId FK
    string storageKey "UUID on disk"
    string originalName
    string mimeType
    int sizeBytes
    datetime submittedAt
  }
  Grade {
    string id PK
    string assessmentId FK "unique with studentId"
    string studentId FK
    int value "0 to 100"
    datetime updatedAt
  }
  ModuleResult {
    string id PK
    string studentId FK "unique with moduleId"
    string moduleId FK
    ResultState state "PENDING PUBLISHED WITHHELD"
    datetime updatedAt
  }
```

## Notes

- `StudentNumberCounter` stands alone: it holds one row per year and hands out Student ID numbers atomically.
- A staff user has no `Student` row; `Payment.recordedById` points to the staff user who recorded the payment.
- Money is stored as integer minor units (pence) in the `amountMinor` and `annualFeeMinor` columns.
- Balances, the late flag, and grade classifications are calculated when read and are not stored.
- A missing `ModuleResult` row means the module's results are `PENDING` for that student.
- PK, FK, and UK map to Prisma `@id`, relation fields, and `@unique`; the "unique with" pairs map to `@@unique([assessmentId, studentId])` and `@@unique([studentId, moduleId])`.
