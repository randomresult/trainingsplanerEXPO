import { useState } from 'react';
import { View, TextInput } from 'react-native';
import { Link } from 'expo-router';
import { Screen, Text, Button } from '@/components/ui';
import { useRegister } from '@/lib/queries/useAuth';

export default function RegisterScreen() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const register = useRegister();

  const canSubmit =
    username.trim() && email.trim() && password.length >= 6;

  return (
    <Screen scroll padding="base">
      <View className="flex-1 justify-center py-8">
        <Text variant="largeTitle" weight="bold" className="mb-2">
          Registrieren
        </Text>
        <Text variant="body" color="muted" className="mb-8">
          Erstelle ein Trainer-Konto.
        </Text>

        <View className="mb-4">
          <Text variant="subhead" weight="semibold" className="mb-2">
            Benutzername
          </Text>
          <TextInput
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
            placeholder="trainer_name"
            placeholderTextColor="#666"
            className="bg-card border border-border rounded-lg px-4 py-3 text-foreground"
          />
        </View>

        <View className="mb-4">
          <Text variant="subhead" weight="semibold" className="mb-2">
            E-Mail
          </Text>
          <TextInput
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
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
            placeholder="Mindestens 6 Zeichen"
            placeholderTextColor="#666"
            className="bg-card border border-border rounded-lg px-4 py-3 text-foreground"
          />
        </View>

        <Button
          size="lg"
          loading={register.isPending}
          disabled={!canSubmit}
          onPress={() => register.mutate({ username, email, password })}
        >
          Registrieren
        </Button>

        {register.isError && (
          <Text variant="footnote" color="destructive" className="mt-3 text-center">
            Registrierung fehlgeschlagen. Bitte versuche es erneut.
          </Text>
        )}

        <View className="mt-8 flex-row justify-center">
          <Text variant="footnote" color="muted">Bereits ein Konto? </Text>
          <Link href="/(auth)/login">
            <Text variant="footnote" color="primary" weight="semibold">
              Anmelden
            </Text>
          </Link>
        </View>
      </View>
    </Screen>
  );
}
