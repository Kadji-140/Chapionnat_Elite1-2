<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
Schema::create('mobile_users', function (Blueprint $table) {
    $table->id();
    $table->string('id_anonyme')->unique();
    $table->string('pseudo')->nullable();
    $table->jsonb('clubs_favoris')->nullable();
    $table->timestamp('date_premiere_visite')->nullable();
    $table->timestamps();
});
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('mobile_users');
    }
};
