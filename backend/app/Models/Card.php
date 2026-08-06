<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Card extends Model
{
    use HasFactory;

    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'id',
        'participant_id',
        'event_id',
        'card_orientation',
        'background_color',
        'status',
        'user_id',
        'thumbnail_path',
    ];

    protected $appends = [
        'name',
        'participant_data',
        'layout_json',
        'layout_done',
    ];

    public function participant()
    {
        return $this->belongsTo(Participant::class);
    }

    public function event()
    {
        return $this->belongsTo(Event::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function layout()
    {
        return $this->hasOne(Layout::class);
    }

    public function getNameAttribute()
    {
        return $this->participant ? $this->participant->name : '';
    }

    public function getParticipantDataAttribute()
    {
        $p = $this->participant;
        if (!$p) return null;

        $custom = is_array($p->custom_fields) 
            ? $p->custom_fields 
            : (json_decode($p->custom_fields, true) ?? []);

        // Split name into first and last name
        $nameParts = explode(' ', $p->name);
        $firstName = $nameParts[0] ?? '';
        $lastName = implode(' ', array_slice($nameParts, 1)) ?? '';

        return array_merge([
            'firstName' => $firstName,
            'lastName' => $lastName,
            'jobTitle' => $p->job_title,
            'company' => $p->company,
            'email' => $p->email,
            'phone' => $p->phone,
            'idType' => $p->id_type,
            'employeeId' => $p->employee_id,
            'category' => $p->category_id,
            'function' => $p->function_id,
            'nationality' => $p->nationality,
        ], $custom);
    }

    public function getLayoutJsonAttribute()
    {
        return $this->layout ? ($this->layout->elements ?? []) : [];
    }

    public function getLayoutDoneAttribute()
    {
        return $this->status === 'completed' || $this->status === 'updated';
    }
}
