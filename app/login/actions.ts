'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export async function login(formData: FormData) {
  const supabase = await createClient();

  const data = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  };

  const { error } = await supabase.auth.signInWithPassword(data);

  if (error) {
    redirect('/login?error=Could not authenticate user');
  }

  revalidatePath('/', 'layout');
  redirect('/dashboard');
}

export async function signup(formData: FormData) {
  const supabase = await createClient();

  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const merchantName = formData.get('merchantName') as string;

  if (!merchantName) {
    redirect('/login?error=Merchant Name is required for signup');
  }

  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
  });

  if (authError || !authData.user) {
    redirect('/login?error=Could not create user');
  }

  // Create Merchant
  const slug = merchantName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
  
  const { data: merchantData, error: merchantError } = await supabase
    .from('merchants')
    .insert({ name: merchantName, slug })
    .select()
    .single();

  if (merchantError || !merchantData) {
    console.error('Merchant creation error:', merchantError);
    redirect('/login?error=Could not create merchant');
  }

  // Create Merchant User Mapping
  const { error: mappingError } = await supabase
    .from('merchant_users')
    .insert({
      merchant_id: merchantData.id,
      user_id: authData.user.id,
      role: 'owner',
    });

  if (mappingError) {
    console.error('Mapping error:', mappingError);
    redirect('/login?error=Could not link user to merchant');
  }

  revalidatePath('/', 'layout');
  redirect('/dashboard');
}
