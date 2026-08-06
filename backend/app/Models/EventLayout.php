<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class EventLayout extends Model
{
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'id',
        'event_id',
        'elements',
        'card_orientation',
        'background_color',
    ];

    protected $casts = [
        'elements' => 'array',
    ];

    public function event()
    {
        return $this->belongsTo(Event::class);
    }
}
