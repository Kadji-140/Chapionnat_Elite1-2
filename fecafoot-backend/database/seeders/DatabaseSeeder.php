<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     * Utilise le FecafootCompleteSeeder (données réelles camerounaises).
     */
    public function run(): void
    {
        $this->call([
           FecafootCompleteSeeder::class,
        ]);
    }
}