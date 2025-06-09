import { useLoaderData, useFetcher } from '@remix-run/react';
import { executeQuery, QueryData } from '@/db/execute-query';
import { WithErrorHandling } from '@/components/hoc/error-handling-wrapper/error-handling-wrapper';
import { UniversalTableCard } from '@/components/building-blocks/universal-table-card/universal-table-card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { LoaderError } from '@/types/loader-error';

// SQL Query to retrieve organization data
export const organizationsQuery = `
  SELECT organization_id, organization_name, industry, address, phone, email, subscription_tier, created_at
  FROM organizations
  ORDER BY organization_name
  LIMIT $1 OFFSET $2
`;

// SQL Query to get the total count of organizations for pagination
export const organizationsCountQuery = `
  SELECT COUNT(*) as total FROM organizations
`;

// TypeScript type for the organization data
export type OrganizationData = {
  organization_id: number;
  organization_name: string;
  industry: string;
  address: string;
  phone: string;
  email: string;
  subscription_tier: string;
  created_at: string;
};

// TypeScript type for the total count
export type OrganizationCountData = {
  total: number;
};

const ITEMS_PER_PAGE = 10;

// Loader function to fetch initial data
export async function loader() {
  try {
    const [organizations, organizationsCount] = await Promise.all([
      executeQuery<OrganizationData>(organizationsQuery, [ITEMS_PER_PAGE.toString(), '0']),
      executeQuery<OrganizationCountData>(organizationsCountQuery),
    ]);

    return {
      organizations,
      organizationsCount,
    };
  } catch (error) {
    console.error('Error in organizations loader:', error);
    return { error: error instanceof Error ? error.message : 'Failed to load organizations data' };
  }
}

interface OrganizationsTableProps {
  organizations: OrganizationData[];
  organizationsCount: number;
  isLoading: boolean;
  onPageChange: (page: number) => void;
  currentPage: number;
}

function OrganizationsTable({ organizations, organizationsCount, isLoading, onPageChange, currentPage }: OrganizationsTableProps) {
  const totalPages = organizationsCount > 0 ? Math.ceil(organizationsCount / ITEMS_PER_PAGE) : 0;

  const PaginationControls = (
    <div className="flex items-center justify-between">
      <div className="text-sm text-muted-foreground">
        Page {currentPage} of {totalPages}
      </div>
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1 || isLoading}
        >
          Previous
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages || isLoading}
        >
          Next
        </Button>
      </div>
    </div>
  );

  return (
    <UniversalTableCard
      title="Organizations"
      description="List of all organizations with their details"
      CardFooterComponent={PaginationControls}
    >
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>ID</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Industry</TableHead>
            <TableHead>Address</TableHead>
            <TableHead>Phone</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Subscription Tier</TableHead>
            <TableHead>Created At</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <TableRow>
              <TableCell colSpan={8} className="text-center">
                Loading...
              </TableCell>
            </TableRow>
          ) : organizations.length === 0 ? (
            <TableRow>
              <TableCell colSpan={8} className="text-center">
                No organizations found
              </TableCell>
            </TableRow>
          ) : (
            organizations.map((org) => (
              <TableRow key={org.organization_id}>
                <TableCell>{org.organization_id}</TableCell>
                <TableCell>{org.organization_name}</TableCell>
                <TableCell>{org.industry}</TableCell>
                <TableCell>{org.address}</TableCell>
                <TableCell>{org.phone}</TableCell>
                <TableCell>{org.email}</TableCell>
                <TableCell>{org.subscription_tier}</TableCell>
                <TableCell>{new Date(org.created_at).toLocaleDateString()}</TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </UniversalTableCard>
  );
}

export default function OrganizationsPage() {
  const loaderData = useLoaderData<typeof loader>();
  const fetcher = useFetcher<QueryData<OrganizationData[]>>();
  const [currentPage, setCurrentPage] = useState(1);

  // Removed the useEffect that was causing continuous re-fetching.
  // The initial data is now solely provided by the loader.

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    const offset = (page - 1) * ITEMS_PER_PAGE;
    fetcher.submit(
      {
        limit: ITEMS_PER_PAGE.toString(),
        offset: offset.toString(),
      },
      { method: 'post', action: '/resources/organizations' }
    );
  };

  if ('error' in loaderData) {
    return <WithErrorHandling queryData={loaderData} render={() => null} />;
  }

  // Prioritize fetcher data if available (after pagination), otherwise use loader data
  const organizationsData = fetcher.data?.data || loaderData.organizations.data;
  const organizationsCount = loaderData.organizationsCount.data?.[0]?.total || 0;

  return (
    <div className="container mx-auto py-8 space-y-8">
      <h1 className="text-3xl font-bold mb-6">Organizations</h1>
      <WithErrorHandling
        queryData={fetcher.data || loaderData.organizations}
        render={(data) => (
          <OrganizationsTable
            organizations={data}
            organizationsCount={organizationsCount}
            isLoading={fetcher.state === 'submitting'}
            onPageChange={handlePageChange}
            currentPage={currentPage}
          />
        )}
      />
    </div>
  );
}
