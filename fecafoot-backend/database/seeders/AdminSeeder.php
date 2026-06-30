<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use App\Models\User;
 
class AdminSeeder extends Seeder
{
    public function run(): void
    {
        // Évite les doublons si on relance le seeder
        if (User::where('email', 'admin@fecafoot.cm')->exists()) {
            $this->command->info('Admin déjà existant, ignoré.');
            return;
        }
 
        User::create([
            'nom'               => 'Administrateur',
            'prenom'            => 'FECAFOOT',
            'email'             => 'administrateur@gmail.com',
            'password'          => Hash::make('Admin@2025!'),
            'role'              => 'admin',
            'peut_creer_admin'  => true,
            'acces_actif'       => true,
            'premiere_connexion' => false, // L'admin n'a pas besoin de changer son mdp
        ]);
 
        $this->command->info('✅ Compte admin créé : admin@fecafoot.cm / Admin@2025!');
    }
}