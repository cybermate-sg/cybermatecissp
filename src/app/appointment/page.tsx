import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import AppointmentClient from "./AppointmentClient";

export default async function AppointmentPage() {
  // Check if user is authenticated
  const { userId } = await auth();

  // If not authenticated, redirect to sign-in with return URL
  if (!userId) {
    redirect("/sign-in?redirect_url=/appointment");
  }

  // If authenticated, show the appointment booking page
  return <AppointmentClient />;
}
