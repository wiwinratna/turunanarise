<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('participants', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->string('event_id');
            $table->string('name');
            $table->string('job_title')->nullable();
            $table->string('company')->nullable();
            $table->string('email')->nullable();
            $table->string('phone')->nullable();
            $table->string('id_type')->nullable();
            $table->string('employee_id')->nullable();
            $table->string('category_id')->nullable();
            $table->string('function_id')->nullable();
            $table->string('nationality')->nullable();
            $table->json('custom_fields')->nullable();
            $table->timestamps();

            $table->foreign('event_id')->references('id')->on('events')->onDelete('cascade');
            $table->foreign('category_id')->references('id')->on('categories')->onDelete('set null');
            $table->foreign('function_id')->references('id')->on('functions')->onDelete('set null');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('participants');
    }
};
