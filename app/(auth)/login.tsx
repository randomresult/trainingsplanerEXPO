import { useState } from 'react';
import { View, TextInput } from 'react-native';
import { Link } from 'expo-router';
import { Screen, Text, Button } from '@/components/ui';
import { useLogin } from '@/lib/queries/useAuth';

export default function LoginScreen() {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const login = useLogin();

  return (
    <Screen padding="base">
      <View className="flex-1 justify-center">
        <Text variant="largeTitle" weight="bold" className="mb-2">
          Anmelden
        </Text>
        <Text variant="body" color="muted" className="mb-8">
          Willkommen zurück beim TT Trainingsplaner.
        </Text>

        <View className="mb-4">
          <Text variant="subhead" weight="semibold" className="mb-2">
            E-Mail oder Benutzername
          </Text>
          <TextInput
            value={identifier}
            onChangeText={setIdentifier}
            autoCapitalize="none"
            placeholder="trainer@example.com"
            placeholderTextColor="#666"
            className="bg-card border border-border rounded-lg px-4 py-3 text-foreground"
          />
        </View>

        <View className="mb-6">
          <Text variant="subhead" weight="semibold" className="mb-2">
            Passwort
          </Text>
          <TextInput
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            placeholder="********"
            placeholderTextColor="#666"
            className="bg-card border border-border rounded-lg px-4 py-3 text-foreground"
          />
        </View>

        <Button
          size="lg"
          loading={login.isPending}
          disabled={!identifier.trim() || !password.trim()}
          onPress={() => login.mutate({ identifier, password })}
        >
          Anmelden
        </Button>

        {login.isError && (
          <Text variant="footnote" color="destructive" className="mt-3 text-center">
            Anmeldung fehlgeschlagen. Bitte überprüfe deine Eingaben.
          </Text>
        )}

        <View className="mt-8 flex-row justify-center">
          <Text variant="footnote" color="muted">Noch kein Konto? </Text>
          <Link href="/(auth)/register">
            <Text variant="footnote" color="primary" weight="semibold">
              Registrieren
            </Text>
          </Link>
        </View>
      </View>
    </Screen>
  );
}
