import { useState } from 'react';
import { View, Text, TextInput, Pressable, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { Link } from 'expo-router';
import { useRegister } from '@/lib/queries/useAuth';

export default function RegisterScreen() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const register = useRegister();

  const handleRegister = () => {
    if (!username || !email || !password || password !== confirmPassword) return;
    register.mutate({ username, email, password });
  };

  const passwordsMatch = !confirmPassword || password === confirmPassword;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-background"
    >
      <ScrollView className="flex-1 p-5" contentContainerStyle={{ justifyContent: 'center', minHeight: '100%' }}>
        <Text className="text-3xl font-bold text-foreground mb-2">Account erstellen</Text>
        <Text className="text-base text-muted-foreground mb-8">
          Registriere dich als Trainer
        </Text>

        <View className="mb-4">
          <Text className="text-sm font-semibold text-foreground mb-2">Username</Text>
          <TextInput
            value={username}
            onChangeText={setUsername}
            placeholder="maxmustermann"
            placeholderTextColor="#666"
            autoCapitalize="none"
            autoCorrect={false}
            className="bg-card border border-border rounded-lg px-4 py-3 text-foreground"
          />
        </View>

        <View className="mb-4">
          <Text className="text-sm font-semibold text-foreground mb-2">E-Mail</Text>
          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder="max@example.com"
            placeholderTextColor="#666"
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            className="bg-card border border-border rounded-lg px-4 py-3 text-foreground"
          />
        </View>

        <View className="mb-4">
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

        <View className="mb-6">
          <Text className="text-sm font-semibold text-foreground mb-2">Passwort bestätigen</Text>
          <TextInput
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            placeholder="••••••••"
            placeholderTextColor="#666"
            secureTextEntry
            className="bg-card border border-border rounded-lg px-4 py-3 text-foreground"
          />
          {!passwordsMatch && (
            <Text className="text-destructive text-xs mt-1">Passwörter stimmen nicht überein</Text>
          )}
        </View>

        <Pressable
          onPress={handleRegister}
          disabled={register.isPending || !username || !email || !password || !passwordsMatch}
          className="bg-primary rounded-xl p-4 disabled:opacity-50"
        >
          {register.isPending ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text className="text-center text-sm font-semibold text-primary-foreground">
              Registrieren
            </Text>
          )}
        </Pressable>

        {register.isError && (
          <View className="mt-4 bg-destructive/10 border border-destructive rounded-lg p-3">
            <Text className="text-destructive text-sm text-center">
              Registrierung fehlgeschlagen. Bitte versuche es erneut.
            </Text>
          </View>
        )}

        <View className="flex-row justify-center mt-6">
          <Text className="text-muted-foreground text-sm">Schon registriert? </Text>
          <Link href="/(auth)/login" asChild>
            <Pressable>
              <Text className="text-primary text-sm font-semibold">Einloggen</Text>
            </Pressable>
          </Link>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
