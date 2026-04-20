import { useState } from 'react';
import { View, Text, TextInput, Pressable, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { Link } from 'expo-router';
import { useLogin } from '@/lib/queries/useAuth';

export default function LoginScreen() {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const login = useLogin();

  const handleLogin = () => {
    if (!identifier || !password) return;
    login.mutate({ identifier, password });
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-background"
    >
      <View className="flex-1 p-5 justify-center">
        <Text className="text-3xl font-bold text-foreground mb-2">Willkommen zurück</Text>
        <Text className="text-base text-muted-foreground mb-8">
          Melde dich an, um fortzufahren
        </Text>

        <View className="mb-4">
          <Text className="text-sm font-semibold text-foreground mb-2">E-Mail oder Username</Text>
          <TextInput
            value={identifier}
            onChangeText={setIdentifier}
            placeholder="max@example.com"
            placeholderTextColor="#666"
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            className="bg-card border border-border rounded-lg px-4 py-3 text-foreground"
          />
        </View>

        <View className="mb-6">
          <Text className="text-sm font-semibold text-foreground mb-2">Passwort</Text>
          <TextInput
            value={password}
            onChangeText={setPassword}
            placeholder="••••••••"
            placeholderTextColor="#666"
            secureTextEntry
            className="bg-card border border-border rounded-lg px-4 py-3 text-foreground"
          />
        </View>

        <Pressable
          onPress={handleLogin}
          disabled={login.isPending || !identifier || !password}
          className="bg-primary rounded-xl p-4 disabled:opacity-50"
        >
          {login.isPending ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text className="text-center text-sm font-semibold text-primary-foreground">
              Einloggen
            </Text>
          )}
        </Pressable>

        {login.isError && (
          <View className="mt-4 bg-destructive/10 border border-destructive rounded-lg p-3">
            <Text className="text-destructive text-sm text-center">
              Login fehlgeschlagen. Bitte überprüfe deine Daten.
            </Text>
          </View>
        )}

        <View className="flex-row justify-center mt-6">
          <Text className="text-muted-foreground text-sm">Noch kein Account? </Text>
          <Link href="/(auth)/register" asChild>
            <Pressable>
              <Text className="text-primary text-sm font-semibold">Registrieren</Text>
            </Pressable>
          </Link>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
