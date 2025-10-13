import { company, users } from "@/lib/data";
import Header from "@/components/dashboard/header";
import { MembersTable } from "@/components/dashboard/members-table";
import { InviteMemberDialog } from "@/components/dashboard/invite-member-dialog";

export default function MembersPage() {
  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <Header title="Members" />
        <InviteMemberDialog company={company} />
      </div>
      <MembersTable data={users} />
    </div>
  );
}
