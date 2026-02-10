import type { Meta, StoryObj } from "@storybook/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useRef } from "react";
import { TableCell, TableRow } from "@/components/ui/table";
import { Column, DataTable } from "./Datatable";

// Mock data types
interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  status: "active" | "inactive";
  createdAt: string;
}

// Generate mock users
const generateMockUsers = (count: number): User[] => {
  const roles = ["Admin", "User", "Manager", "Guest"];
  const statuses: ("active" | "inactive")[] = ["active", "inactive"];

  return Array.from({ length: count }, (_, i) => ({
    id: `user-${i + 1}`,
    name: `User ${i + 1}`,
    email: `user${i + 1}@example.com`,
    role: roles[i % roles.length],
    status: statuses[i % 2],
    createdAt: new Date(Date.now() - Math.random() * 10000000000).toISOString(),
  }));
};

const allMockUsers = generateMockUsers(100);

// Mock fetch function
const mockFetchUsers = async (params: {
  page: number;
  pageSize: number;
  search: string;
  sortBy: string;
  sortOrder: "asc" | "desc";
}) => {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 500));

  // Filter by search
  let filteredUsers = allMockUsers;
  if (params.search) {
    const searchLower = params.search.toLowerCase();
    filteredUsers = allMockUsers.filter(
      (user) =>
        user.name.toLowerCase().includes(searchLower) ||
        user.email.toLowerCase().includes(searchLower) ||
        user.role.toLowerCase().includes(searchLower)
    );
  }

  // Sort
  const sortedUsers = [...filteredUsers].sort((a, b) => {
    const aVal = a[params.sortBy as keyof User];
    const bVal = b[params.sortBy as keyof User];

    if (aVal < bVal) return params.sortOrder === "asc" ? -1 : 1;
    if (aVal > bVal) return params.sortOrder === "asc" ? 1 : -1;
    return 0;
  });

  // Paginate
  const start = (params.page - 1) * params.pageSize;
  const end = start + params.pageSize;
  const paginatedUsers = sortedUsers.slice(start, end);

  return {
    success: true,
    data: paginatedUsers,
    pagination: {
      page: params.page,
      pageSize: params.pageSize,
      total: filteredUsers.length,
      totalPages: Math.ceil(filteredUsers.length / params.pageSize),
    },
  };
};

// Mock fetch with no data
const mockFetchUsersEmpty = async (params: any) => {
  await new Promise((resolve) => setTimeout(resolve, 500));
  return {
    success: true,
    data: [],
    pagination: {
      page: params.page,
      pageSize: params.pageSize,
      total: 0,
      totalPages: 0,
    },
  };
};

// Column definitions
const columns: Column[] = [
  {
    key: "name",
    label: "Name",
    sortable: true,
    colSpan: undefined,
    className: undefined,
  },
  {
    key: "email",
    label: "Email",
    sortable: true,
    colSpan: undefined,
    className: undefined,
  },
  {
    key: "role",
    label: "Role",
    sortable: true,
    colSpan: undefined,
    className: undefined,
  },
  {
    key: "status",
    label: "Status",
    sortable: true,
    colSpan: undefined,
    className: undefined,
  },
  {
    key: "createdAt",
    label: "Created",
    sortable: true,
    colSpan: undefined,
    className: undefined,
  },
];
// Column definitions with custom styling
const columnsWithClassName: Column[] = [
  {
    key: "name",
    label: "Name",
    sortable: true,
    className: "w-[200px] bg-blue-50 text-blue-900 border-2 border-blue-300",
  },
  {
    key: "email",
    label: "Email",
    sortable: true,
    className:
      "min-w-[250px] bg-green-50 text-green-900 border-2 border-green-300",
  },
  {
    key: "role",
    label: "Role",
    sortable: true,
    className:
      "text-center w-[120px] bg-purple-50 text-purple-900 border-2 border-purple-300",
  },
  {
    key: "status",
    label: "Status",
    sortable: true,
    className:
      "text-center w-[100px] bg-yellow-50 text-yellow-900 border-2 border-yellow-300",
  },
  {
    key: "createdAt",
    label: "Created",
    sortable: true,
    className:
      "text-right w-[150px] bg-red-50 text-red-900 border-2 border-red-300",
  },
];
// Column definitions
const columnsDouble: Column[][] = [
  [
    {
      key: "personal",
      label: "Personal Information",
      sortable: false,
      colSpan: 2,
    },
    {
      key: "account",
      label: "Account Information",
      sortable: false,
      colSpan: 3,
    },
  ],
  [
    {
      key: "name",
      label: "Name",
      sortable: true,
    },
    {
      key: "email",
      label: "Email",
      sortable: true,
    },
    {
      key: "role",
      label: "Role",
      sortable: true,
    },
    {
      key: "status",
      label: "Status",
      sortable: true,
    },
    {
      key: "createdAt",
      label: "Created",
      sortable: true,
    },
  ],
];
const rows = (users: User[]) =>
  users.map((user) => (
    <TableRow key={user.id}>
      <TableCell>{user.name}</TableCell>
      <TableCell>{user.email}</TableCell>
      <TableCell>
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
          {user.role}
        </span>
      </TableCell>
      <TableCell>
        <span
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
            user.status === "active"
              ? "bg-green-100 text-green-800"
              : "bg-gray-100 text-gray-800"
          }`}
        >
          {user.status}
        </span>
      </TableCell>
      <TableCell>{new Date(user.createdAt).toLocaleDateString()}</TableCell>
    </TableRow>
  ));

// Create a new QueryClient for each story to avoid cache issues
const createQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

const meta = {
  title: "Components/DataTable",
  component: DataTable<User>,
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "Fully responsive server-side data table with pagination, sorting, and search powered by React Query. Features mobile-optimized layout with touch-friendly controls, horizontal scrolling for wide tables, and adaptive spacing. Requires @tanstack/react-query to be installed.",
      },
    },
  },
  tags: ["autodocs"],
  decorators: [
    (Story) => {
      const queryClient = createQueryClient();
      return (
        <QueryClientProvider client={queryClient}>
          <div className="max-w-7xl">
            <Story />
          </div>
        </QueryClientProvider>
      );
    },
  ],
} satisfies Meta<typeof DataTable<User>>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    fetchAction: mockFetchUsers,
    columns,
    queryKey: "users-default",
    searchPlaceholder: "Search users...",
    defaultSortBy: "name",
    defaultSortOrder: "asc",
    rows,
  },
};

export const SortedByDate: Story = {
  args: {
    fetchAction: mockFetchUsers,
    columns,
    queryKey: "users-sorted",
    searchPlaceholder: "Search users...",
    defaultSortBy: "createdAt",
    defaultSortOrder: "desc",
    rows,
  },
};

export const EmptyState: Story = {
  args: {
    fetchAction: mockFetchUsersEmpty,
    columns,
    queryKey: "users-empty",
    searchPlaceholder: "Search users...",
    rows,
  },
};
export const DoubleColumnState: Story = {
  args: {
    fetchAction: mockFetchUsers,
    columns: columnsDouble,
    queryKey: "users-double",
    searchPlaceholder: "Search users...",
    rows,
  },
};
export const CustomSearchPlaceholder: Story = {
  args: {
    fetchAction: mockFetchUsers,
    columns,
    queryKey: "users-custom-search",
    searchPlaceholder: "Cari pengguna berdasarkan nama, email, atau role...",
    rows,
  },
};

export const WithRefInvalidate: Story = {
  args: {
    fetchAction: mockFetchUsers,
    columns,
    queryKey: "users-with-ref",
    searchPlaceholder: "Search users...",
    rows,
  },
  render: () => {
    const queryClient = createQueryClient();
    const tableRef = useRef<any>(null);

    const handleRefresh = () => {
      tableRef.current?.invalidate();
    };

    return (
      <QueryClientProvider client={queryClient}>
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold">Users Table</h2>
            <button
              onClick={handleRefresh}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Refresh Table
            </button>
          </div>
          <DataTable
            ref={tableRef}
            fetchAction={mockFetchUsers}
            columns={columns}
            queryKey="users-with-ref"
            searchPlaceholder="Search users..."
            rows={rows}
          />
        </div>
      </QueryClientProvider>
    );
  },
};

export const MinimalColumns: Story = {
  args: {
    fetchAction: mockFetchUsers,
    columns: [
      {
        key: "name",
        label: "Name",
        sortable: true,
      },
      {
        key: "email",
        label: "Email",
        sortable: true,
      },
    ],
    queryKey: "users-minimal",
    searchPlaceholder: "Search...",
    rows,
  },
};

export const ManyColumns: Story = {
  args: {
    fetchAction: mockFetchUsers,
    columns: [
      {
        key: "id",
        label: "ID",
        sortable: true,
      },
      ...columns,
    ],
    queryKey: "users-many-columns",
    searchPlaceholder: "Search users...",
    rows,
  },
  parameters: {
    docs: {
      description: {
        story:
          "Table with many columns demonstrates horizontal scrolling on mobile and narrow viewports. The table becomes scrollable horizontally to accommodate all columns.",
      },
    },
  },
};

export const CustomPageSizeOptions: Story = {
  args: {
    fetchAction: mockFetchUsers,
    columns,
    queryKey: "users-custom-page-size",
    searchPlaceholder: "Search users...",
    pageSizeOptions: [5, 15, 30, 100],
    rows,
  },
};

export const MobileView: Story = {
  args: {
    fetchAction: mockFetchUsers,
    columns,
    queryKey: "users-mobile",
    searchPlaceholder: "Search users...",
    rows,
  },
  parameters: {
    viewport: {
      defaultViewport: "mobile1",
    },
    docs: {
      description: {
        story:
          "Mobile-optimized view with vertical stacking of controls, touch-friendly button sizes (40x40px), and responsive pagination with reduced page numbers for better mobile experience.",
      },
    },
  },
  decorators: [
    (Story) => {
      const queryClient = createQueryClient();
      return (
        <QueryClientProvider client={queryClient}>
          <div className="max-w-sm mx-auto">
            <Story />
          </div>
        </QueryClientProvider>
      );
    },
  ],
};

export const CustomColumnStyling: Story = {
  args: {
    fetchAction: mockFetchUsers,
    columns: columnsWithClassName,
    queryKey: "users-custom-styling",
    searchPlaceholder: "Search users...",
    rows,
  },
  parameters: {
    docs: {
      description: {
        story:
          "Demonstrates custom column styling using className property. Each column can have custom width, alignment, background colors, and text colors. In this example: Name (blue bg, 200px width), Email (green bg, min-width 250px), Role (purple bg, centered, 120px), Status (yellow bg, centered, 100px), and Created date (red bg, right-aligned, 150px). You can use any Tailwind classes for styling columns.",
      },
    },
  },
};

// Note: Error state story removed as it causes issues in Storybook
// To test error state, you can modify the fetchAction to throw an error
