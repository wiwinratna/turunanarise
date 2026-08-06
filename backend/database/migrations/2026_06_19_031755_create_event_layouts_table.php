<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('event_layouts', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->string('event_id')->unique(); // 1 layout per event
            $table->json('elements');
            $table->string('card_orientation')->default('landscape');
            $table->string('background_color')->default('#13131e');
            $table->timestamps();

            $table->foreign('event_id')->references('id')->on('events')->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('event_layouts');
    }
};
