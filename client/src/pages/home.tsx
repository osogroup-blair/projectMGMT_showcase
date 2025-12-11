import { UserHomePage } from "@/components/home/user-home-page";
import { MOCK_USER_HOME_STATE } from "@/lib/mock-home-data";

export default function Home() {
  return (
    <UserHomePage homeState={MOCK_USER_HOME_STATE} />
  );
}
