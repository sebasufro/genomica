"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Edit3, UserCircle2 } from "lucide-react";

export default function ProfilePage() {
  const { toast } = useToast();

  const user = {
    name: "Dra. Ada Lovelace",
    email: "ada.lovelace@example.com",
    role: "Investigadora Principal",
    avatarUrl: "https://placehold.co/128x128.png",
    initials: "AL",
  };

  const handleEditProfile = () => {
    toast({
      title: "Función No Implementada",
      description: "La edición del perfil aún no está disponible.",
    });
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Card>
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Avatar className="h-32 w-32 border-4 border-primary/20">
              <AvatarImage
                src={user.avatarUrl}
                alt={user.name}
                data-ai-hint="perfil avatar"
              />
              <AvatarFallback>{user.initials}</AvatarFallback>
            </Avatar>
          </div>
          <CardTitle className="text-3xl font-headline">{user.name}</CardTitle>
          <CardDescription className="text-lg text-muted-foreground">
            {user.role}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name">Nombre Completo</Label>
            <Input id="name" value={user.name} readOnly />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Correo Electrónico</Label>
            <Input id="email" type="email" value={user.email} readOnly />
          </div>
          <div className="space-y-2">
            <Label htmlFor="role">Rol</Label>
            <Input id="role" value={user.role} readOnly />
          </div>

          <Button
            onClick={handleEditProfile}
            className="w-full"
            variant="outline"
          >
            <Edit3 className="mr-2 h-4 w-4" />
            Editar Perfil (Próximamente)
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="font-headline flex items-center gap-2">
            <UserCircle2 className="h-5 w-5 text-muted-foreground" />
            Información de la Cuenta
          </CardTitle>
          <CardDescription>
            Configuraciones y preferencias adicionales de la cuenta estarán
            disponibles aquí.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Más detalles de la cuenta y opciones como cambio de contraseña,
            preferencias de notificación, etc., se añadirán en futuras
            actualizaciones.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
