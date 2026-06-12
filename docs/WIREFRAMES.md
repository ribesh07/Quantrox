# Wireframes (High-level)

Use these simple layouts as starting points for UI implementation.

Admin Dashboard
````mermaid
flowchart TB
  subgraph AdminHeader[Admin Header]
    A[Logo] --> B[Search]
    B --> C[Notifications]
    C --> D[Profile]
  end
  subgraph Main[Main]
    E[Sidebar] --> F[Overview Cards]
    F --> G[Recent Transactions Table]
    E --> H[Management Tools]
  end
````

User Dashboard
````mermaid
flowchart TB
  subgraph Header
    A[Logo] --> B[Wallet Balance]
    B --> C[Exchange Button]
  end
  subgraph Content
    D[Overview Cards] --> E[Recent Transactions]
    E --> F[Wallet Details & History]
  end
````

Notes: Use ShadCN components for consistent styling and Tailwind for layout.