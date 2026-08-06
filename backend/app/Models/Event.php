<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class Event extends Model
{
    use HasFactory, HasUuids;

    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'id',
        'event_code',
        'name',
        'date',
        'location',
        'country_id',
        'description',
        'active',
    ];

    protected $casts = [
        'active' => 'boolean',
    ];

    public function users()
    {
        return $this->hasMany(User::class);
    }

    public function participants()
    {
        return $this->hasMany(Participant::class);
    }

    public function cards()
    {
        return $this->hasMany(Card::class);
    }

    public function eventLayout()
    {
        return $this->hasOne(EventLayout::class);
    }
}
