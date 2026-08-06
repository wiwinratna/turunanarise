<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Layout extends Model
{
    use HasFactory;

    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'id',
        'card_id',
        'elements',
    ];

    protected $casts = [
        'elements' => 'array',
    ];

    public function card()
    {
        return $this->belongsTo(Card::class);
    }
}
