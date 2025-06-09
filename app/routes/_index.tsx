import { useLoaderData } from '@remix-run/react';
import { ErrorComponent } from '@/components/building-blocks/error-component/error-component';
import OrganizationsPage, { loader as organizationsLoader } from './organizations';

export async function loader() {
  return organizationsLoader();
}

export default function Index() {
  const data = useLoaderData<typeof loader>();

  if ('error' in data) {
    return <ErrorComponent errorMessage={data.error} />;
  }

  return <OrganizationsPage {...data} />;
}
