import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RemoteAutoComplete } from "./RemoteAutoComplete";
import { FetchResult } from "../../types/pagination-result";

// Export the option interface for proper typing

// Mock data types
interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  department: string;
  avatar?: string;
}

interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  sku: string;
  inStock: boolean;
}

interface Country {
  id: string;
  name: string;
  code: string;
  continent: string;
  population: number;
}

// Generate mock data
const generateMockUsers = (count: number): User[] => {
  const roles = ["Admin", "User", "Manager", "Developer", "Designer"];
  const departments = ["Engineering", "Marketing", "Sales", "HR", "Finance"];

  return Array.from({ length: count }, (_, i) => ({
    id: `user-${i + 1}`,
    name: `User ${i + 1}`,
    email: `user${i + 1}@company.com`,
    role: roles[i % roles.length],
    department: departments[i % departments.length],
  }));
};

const generateMockProducts = (count: number): Product[] => {
  const categories = [
    "Electronics",
    "Clothing",
    "Books",
    "Home & Garden",
    "Sports",
  ];

  return Array.from({ length: count }, (_, i) => ({
    id: `product-${i + 1}`,
    name: `Product ${i + 1}`,
    category: categories[i % categories.length],
    price: Math.floor(Math.random() * 1000) + 10,
    sku: `SKU-${String(i + 1).padStart(4, "0")}`,
    inStock: Math.random() > 0.3,
  }));
};

const generateMockCountries = (): Country[] => [
  {
    id: "us",
    name: "United States",
    code: "US",
    continent: "North America",
    population: 331900000,
  },
  {
    id: "ca",
    name: "Canada",
    code: "CA",
    continent: "North America",
    population: 38000000,
  },
  {
    id: "mx",
    name: "Mexico",
    code: "MX",
    continent: "North America",
    population: 128900000,
  },
  {
    id: "br",
    name: "Brazil",
    code: "BR",
    continent: "South America",
    population: 215300000,
  },
  {
    id: "ar",
    name: "Argentina",
    code: "AR",
    continent: "South America",
    population: 45400000,
  },
  {
    id: "gb",
    name: "United Kingdom",
    code: "GB",
    continent: "Europe",
    population: 67300000,
  },
  {
    id: "de",
    name: "Germany",
    code: "DE",
    continent: "Europe",
    population: 83200000,
  },
  {
    id: "fr",
    name: "France",
    code: "FR",
    continent: "Europe",
    population: 67400000,
  },
  {
    id: "it",
    name: "Italy",
    code: "IT",
    continent: "Europe",
    population: 59100000,
  },
  {
    id: "es",
    name: "Spain",
    code: "ES",
    continent: "Europe",
    population: 47400000,
  },
  {
    id: "jp",
    name: "Japan",
    code: "JP",
    continent: "Asia",
    population: 125800000,
  },
  {
    id: "cn",
    name: "China",
    code: "CN",
    continent: "Asia",
    population: 1412000000,
  },
  {
    id: "in",
    name: "India",
    code: "IN",
    continent: "Asia",
    population: 1380000000,
  },
  {
    id: "kr",
    name: "South Korea",
    code: "KR",
    continent: "Asia",
    population: 51300000,
  },
  {
    id: "au",
    name: "Australia",
    code: "AU",
    continent: "Oceania",
    population: 25700000,
  },
  {
    id: "id",
    name: "Indonesia",
    code: "ID",
    continent: "Asia",
    population: 273500000,
  },
  {
    id: "th",
    name: "Thailand",
    code: "TH",
    continent: "Asia",
    population: 69800000,
  },
  {
    id: "sg",
    name: "Singapore",
    code: "SG",
    continent: "Asia",
    population: 5900000,
  },
  {
    id: "my",
    name: "Malaysia",
    code: "MY",
    continent: "Asia",
    population: 32400000,
  },
  {
    id: "ph",
    name: "Philippines",
    code: "PH",
    continent: "Asia",
    population: 109600000,
  },
];

const allMockUsers = generateMockUsers(150);
const allMockProducts = generateMockProducts(200);
const allMockCountries = generateMockCountries();

// Mock fetch functions
const mockFetchUsers = async (params: {
  page: number;
  pageSize: number;
  search: string;
}): Promise<FetchResult<User>> => {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 300));

  // Filter by search
  let filteredUsers = allMockUsers;
  if (params.search) {
    const searchLower = params.search.toLowerCase();
    filteredUsers = allMockUsers.filter(
      (user) =>
        user.name.toLowerCase().includes(searchLower) ||
        user.email.toLowerCase().includes(searchLower) ||
        user.role.toLowerCase().includes(searchLower) ||
        user.department.toLowerCase().includes(searchLower)
    );
  }

  // Paginate
  const startIndex = (params.page - 1) * params.pageSize;
  const endIndex = startIndex + params.pageSize;
  const paginatedUsers = filteredUsers.slice(startIndex, endIndex);

  const totalPages = Math.ceil(filteredUsers.length / params.pageSize);

  return {
    success: true,
    data: paginatedUsers,
    pagination: {
      page: params.page,
      pageSize: params.pageSize,
      totalPages,
      total: filteredUsers.length,
    },
  };
};

const mockFetchProducts = async (params: {
  page: number;
  pageSize: number;
  search: string;
}): Promise<FetchResult<Product>> => {
  await new Promise((resolve) => setTimeout(resolve, 400));

  let filteredProducts = allMockProducts;
  if (params.search) {
    const searchLower = params.search.toLowerCase();
    filteredProducts = allMockProducts.filter(
      (product) =>
        product.name.toLowerCase().includes(searchLower) ||
        product.category.toLowerCase().includes(searchLower) ||
        product.sku.toLowerCase().includes(searchLower)
    );
  }

  const startIndex = (params.page - 1) * params.pageSize;
  const endIndex = startIndex + params.pageSize;
  const paginatedProducts = filteredProducts.slice(startIndex, endIndex);

  const totalPages = Math.ceil(filteredProducts.length / params.pageSize);

  return {
    success: true,
    data: paginatedProducts,
    pagination: {
      page: params.page,
      pageSize: params.pageSize,
      totalPages,
      total: filteredProducts.length,
    },
  };
};

const mockFetchCountries = async (params: {
  page: number;
  pageSize: number;
  search: string;
}): Promise<FetchResult<Country>> => {
  await new Promise((resolve) => setTimeout(resolve, 200));

  let filteredCountries = allMockCountries;
  if (params.search) {
    const searchLower = params.search.toLowerCase();
    filteredCountries = allMockCountries.filter(
      (country) =>
        country.name.toLowerCase().includes(searchLower) ||
        country.code.toLowerCase().includes(searchLower) ||
        country.continent.toLowerCase().includes(searchLower)
    );
  }

  const startIndex = (params.page - 1) * params.pageSize;
  const endIndex = startIndex + params.pageSize;
  const paginatedCountries = filteredCountries.slice(startIndex, endIndex);

  const totalPages = Math.ceil(filteredCountries.length / params.pageSize);

  return {
    success: true,
    data: paginatedCountries,
    pagination: {
      page: params.page,
      pageSize: params.pageSize,
      totalPages,
      total: filteredCountries.length,
    },
  };
};

// Create QueryClient for stories
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      staleTime: 1000 * 60 * 5, // 5 minutes
    },
  },
});

// Wrapper component with QueryClientProvider
const AutoCompleteWrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={queryClient}>
    <div className="w-96">{children}</div>
  </QueryClientProvider>
);

// Define story args interface
interface StoryArgs {
  placeholder?: string;
  disabled?: boolean;
  allowClear?: boolean;
  pageSize?: number;
  error?: string;
}

const meta: Meta<StoryArgs> = {
  title: "Components/RemoteAutoComplete",
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component: `
A highly reusable and modular autocomplete component that can work with any API endpoint and any data type. 
Features infinite scroll pagination for large datasets. Simply configure the API endpoint, data transformation, 
pagination parameters, and optional custom rendering functions.

## Features
- **Infinite Scroll**: Automatically loads more data as user scrolls
- **Search/Filter**: Real-time search with debouncing
- **Customizable**: Custom option rendering and display text formatting
- **Type Safe**: Full TypeScript support with generic types
- **Accessible**: ARIA attributes and keyboard navigation
- **Error Handling**: Built-in error states and loading indicators
        `,
      },
    },
  },
  tags: ["autodocs"],
  decorators: [
    (Story) => (
      <AutoCompleteWrapper>
        <Story />
      </AutoCompleteWrapper>
    ),
  ],
  argTypes: {
    placeholder: {
      control: "text",
      description: "Placeholder text for the input",
    },
    disabled: {
      control: "boolean",
      description: "Whether the component is disabled",
    },
    allowClear: {
      control: "boolean",
      description: "Whether to show clear button when item is selected",
    },
    pageSize: {
      control: "number",
      description: "Number of items to fetch per page",
    },
    error: {
      control: "text",
      description: "Error message to display",
    },
  },
};

export default meta;
type Story = StoryObj<StoryArgs>;

// Basic Users AutoComplete
export const BasicUsers: Story = {
  render: (args) => {
    const [value, setValue] = useState("");

    return (
      <RemoteAutoComplete<User>
        value={value}
        onValueChange={(newValue) => setValue(newValue)}
        queryKey={["users"]}
        fetchAction={mockFetchUsers}
        transformData={(users) =>
          users.map((user) => ({
            value: user.id,
            label: user.name,
            subLabel: user.email,
          }))
        }
        placeholder={args.placeholder}
        disabled={args.disabled}
        allowClear={args.allowClear}
        pageSize={args.pageSize}
        error={args.error}
      />
    );
  },
  args: {
    placeholder: "Search users...",
    pageSize: 10,
    allowClear: true,
    disabled: false,
  },
};

// Products with Custom Rendering
export const ProductsWithCustomRendering: Story = {
  render: (args) => {
    const [value, setValue] = useState("");

    return (
      <RemoteAutoComplete<Product>
        value={value}
        onValueChange={(newValue) => setValue(newValue)}
        queryKey={["products"]}
        fetchAction={mockFetchProducts}
        transformData={(products) =>
          products.map((product) => ({
            value: product.id,
            label: product.name,
            subLabel: `${product.category} - $${product.price}`,
          }))
        }
        renderOption={(option) => (
          <div className="flex justify-between items-center w-full">
            <div className="flex flex-col">
              <span className="font-medium">{option.label}</span>
              <span className="text-xs text-muted-foreground">
                {option.subLabel}
              </span>
            </div>
            <div className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-sm">
              In Stock
            </div>
          </div>
        )}
        getDisplayText={(option) => `${option.label} (${option.subLabel})`}
        placeholder={args.placeholder}
        disabled={args.disabled}
        allowClear={args.allowClear}
        pageSize={args.pageSize}
        error={args.error}
      />
    );
  },
  args: {
    placeholder: "Search products...",
    pageSize: 8,
    allowClear: true,
    disabled: false,
  },
};

// Countries with Small Page Size
export const CountriesSmallPageSize: Story = {
  render: (args) => {
    const [value, setValue] = useState("");

    return (
      <RemoteAutoComplete<Country>
        value={value}
        onValueChange={(newValue) => setValue(newValue)}
        queryKey={["countries"]}
        fetchAction={mockFetchCountries}
        transformData={(countries) =>
          countries.map((country) => ({
            value: country.id,
            label: country.name,
            subLabel: `${country.code} - ${country.continent}`,
          }))
        }
        renderOption={(option) => (
          <div className="flex items-center gap-3">
            <div className="w-8 h-6 bg-gray-200 rounded-sm flex items-center justify-center text-xs font-mono">
              {option.subLabel?.split(" - ")[0]}
            </div>
            <div className="flex flex-col">
              <span className="font-medium">{option.label}</span>
              <span className="text-xs text-muted-foreground">
                {option.subLabel?.split(" - ")[1]}
              </span>
            </div>
          </div>
        )}
        placeholder={args.placeholder}
        disabled={args.disabled}
        allowClear={args.allowClear}
        pageSize={args.pageSize}
        error={args.error}
      />
    );
  },
  args: {
    placeholder: "Search countries...",
    pageSize: 5,
    allowClear: true,
    disabled: false,
  },
};

// Disabled State
export const Disabled: Story = {
  render: (args) => {
    const [value, setValue] = useState("user-1");

    return (
      <RemoteAutoComplete<User>
        value={value}
        onValueChange={(newValue) => setValue(newValue)}
        queryKey={["users-disabled"]}
        fetchAction={mockFetchUsers}
        transformData={(users) =>
          users.map((user) => ({
            value: user.id,
            label: user.name,
            subLabel: user.email,
          }))
        }
        placeholder={args.placeholder}
        disabled={args.disabled}
        allowClear={args.allowClear}
        pageSize={args.pageSize}
        error={args.error}
      />
    );
  },
  args: {
    placeholder: "This is disabled...",
    disabled: true,
    pageSize: 10,
    allowClear: true,
  },
};

// With Error State
export const WithError: Story = {
  render: (args) => {
    const [value, setValue] = useState("");

    return (
      <RemoteAutoComplete<User>
        value={value}
        onValueChange={(newValue) => setValue(newValue)}
        queryKey={["users-error"]}
        fetchAction={mockFetchUsers}
        transformData={(users) =>
          users.map((user) => ({
            value: user.id,
            label: user.name,
            subLabel: user.email,
          }))
        }
        placeholder={args.placeholder}
        disabled={args.disabled}
        allowClear={args.allowClear}
        pageSize={args.pageSize}
        error={args.error}
      />
    );
  },
  args: {
    placeholder: "Search users...",
    error: "This field is required",
    pageSize: 10,
    allowClear: true,
    disabled: false,
  },
};

// Without Clear Button
export const WithoutClearButton: Story = {
  render: (args) => {
    const [value, setValue] = useState("");

    return (
      <RemoteAutoComplete<User>
        value={value}
        onValueChange={(newValue) => setValue(newValue)}
        queryKey={["users-no-clear"]}
        fetchAction={mockFetchUsers}
        transformData={(users) =>
          users.map((user) => ({
            value: user.id,
            label: user.name,
            subLabel: user.email,
          }))
        }
        placeholder={args.placeholder}
        disabled={args.disabled}
        allowClear={args.allowClear}
        pageSize={args.pageSize}
        error={args.error}
      />
    );
  },
  args: {
    placeholder: "Search users (no clear button)...",
    allowClear: false,
    pageSize: 10,
    disabled: false,
  },
};

// Large Page Size for Testing Infinite Scroll
export const LargePageSize: Story = {
  render: (args) => {
    const [value, setValue] = useState("");

    return (
      <RemoteAutoComplete<User>
        value={value}
        onValueChange={(newValue) => setValue(newValue)}
        queryKey={["users-large"]}
        fetchAction={mockFetchUsers}
        transformData={(users) =>
          users.map((user) => ({
            value: user.id,
            label: user.name,
            subLabel: `${user.email} - ${user.role}`,
          }))
        }
        placeholder={args.placeholder}
        disabled={args.disabled}
        allowClear={args.allowClear}
        pageSize={args.pageSize}
        error={args.error}
      />
    );
  },
  args: {
    placeholder: "Search from 150 users...",
    pageSize: 20,
    allowClear: true,
    disabled: false,
  },
};

// Pre-selected Value
export const PreSelectedValue: Story = {
  render: (args) => {
    const [value, setValue] = useState("user-5");

    return (
      <div className="space-y-4">
        <p className="text-sm text-gray-600">
          This AutoComplete has a pre-selected value (user-5)
        </p>
        <RemoteAutoComplete<User>
          value={value}
          onValueChange={(newValue) => setValue(newValue)}
          queryKey={["users-preselected"]}
          fetchAction={mockFetchUsers}
          transformData={(users) =>
            users.map((user) => ({
              value: user.id,
              label: user.name,
              subLabel: user.email,
            }))
          }
          placeholder={args.placeholder}
          disabled={args.disabled}
          allowClear={args.allowClear}
          pageSize={args.pageSize}
          error={args.error}
        />
      </div>
    );
  },
  args: {
    placeholder: "Search users...",
    pageSize: 10,
    allowClear: true,
    disabled: false,
  },
};
