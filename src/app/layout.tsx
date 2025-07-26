import type { Metadata } from "next";
import "./globals.css";
import {
	SidebarProvider,
	Sidebar,
	SidebarInset,
	SidebarHeader,
	SidebarContent,
	SidebarFooter,
	SidebarTrigger,
	SidebarMenu,
	SidebarMenuItem,
	SidebarMenuButton,
} from "@/components/ui/sidebar";
import { Toaster } from "@/components/ui/toaster";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Home, List, PlusSquare, UserCircle, BarChart3 } from "lucide-react"; // Using BarChart3 for GenAI logo placeholder

export const metadata: Metadata = {
	title: "BioTrackr Inventario",
	description:
		"Rastrea y gestiona el inventario del laboratorio genómico eficientemente.",
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="es">
			<head></head>
			<body className="font-body antialiased">
				<SidebarProvider defaultOpen={true}>
					<Sidebar>
						<SidebarHeader className="p-4">
							<div className="flex items-center gap-2">
								<BarChart3 className="h-8 w-8 text-primary" />
								<h1 className="text-xl font-headline font-semibold">
									BioTrackr
								</h1>
							</div>
						</SidebarHeader>
						<SidebarContent>
							<SidebarMenu>
								<SidebarMenuItem>
									<Link href="/dashboard" passHref>
										<SidebarMenuButton tooltip="Dashboard">
											<Home />
											<span>Dashboard</span>
										</SidebarMenuButton>
									</Link>
								</SidebarMenuItem>
								<SidebarMenuItem>
									<Link href="/inventory" passHref>
										<SidebarMenuButton tooltip="Inventario">
											<List />
											<span>Inventario</span>
										</SidebarMenuButton>
									</Link>
								</SidebarMenuItem>
								<SidebarMenuItem>
									<Link href="/add-item" passHref>
										<SidebarMenuButton tooltip="Añadir Insumo">
											<PlusSquare />
											<span>Añadir Insumo</span>
										</SidebarMenuButton>
									</Link>
								</SidebarMenuItem>
							</SidebarMenu>
						</SidebarContent>
						<SidebarFooter className="p-4 flex flex-col gap-2"></SidebarFooter>
					</Sidebar>
					<SidebarInset>
						<header className="sticky top-0 z-50 flex h-14 items-center gap-4 border-b bg-background/80 backdrop-blur-sm px-4 lg:h-[60px] lg:px-6">
							<SidebarTrigger className="md:hidden" />
							<h2 className="text-lg font-headline font-semibold">
								Gestor de Inventario
							</h2>
						</header>
						<main className="flex-1 p-4 md:p-6 lg:p-8">{children}</main>
					</SidebarInset>
				</SidebarProvider>
				<Toaster />
			</body>
		</html>
	);
}
