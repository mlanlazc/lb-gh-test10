import { executeQuery } from '@/db/execute-query';
import { organizationsQuery, OrganizationData } from '@/routes/organizations';

export async function action({ request }: { request: Request }) {
  if (request.method !== 'POST') {
    return Response.json({ error: 'Method not allowed' }, { status: 405 });
  }

  try {
    const formData = await request.formData();
    const limit = parseInt(formData.get('limit') as string) || 10;
    const offset = parseInt(formData.get('offset') as string) || 0;

    const organizations = await executeQuery<OrganizationData>(organizationsQuery, [limit.toString(), offset.toString()]);

    if (organizations.isError) {
      return Response.json(organizations);
    }

    return Response.json({
      data: organizations.data,
      isError: false,
    });
  } catch (error) {
    console.error('Error fetching organizations:', error);
    return Response.json({ error: 'Failed to fetch organizations' }, { status: 500 });
  }
}
