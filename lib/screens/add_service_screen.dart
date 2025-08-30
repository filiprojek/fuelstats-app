import 'package:flutter/material.dart';

import '../models/service.dart';

class AddServiceScreen extends StatefulWidget {
  final void Function(ServiceRecord record)? onSaved;

  const AddServiceScreen({super.key, this.onSaved});

  @override
  State<AddServiceScreen> createState() => _AddServiceScreenState();
}

class _AddServiceScreenState extends State<AddServiceScreen> {
  final _formKey = GlobalKey<FormState>();
  final TextEditingController _shopController = TextEditingController();
  bool _performedAtShop = false;

  @override
  void dispose() {
    _shopController.dispose();
    super.dispose();
  }

  void _togglePerformedAtShop(bool value) {
    setState(() {
      _performedAtShop = value;
      if (!_performedAtShop) {
        _shopController.clear();
      }
    });
  }

  void _submit() {
    if (!_formKey.currentState!.validate()) {
      return;
    }

    final record = ServiceRecord(
      vehicleId: 'vehicle', // placeholder, would come from state
      shop: _performedAtShop ? _shopController.text.trim() : null,
      selfService: !_performedAtShop,
    );

    widget.onSaved?.call(record);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Add Service Record'),
      ),
      body: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              SwitchListTile(
                title: const Text('Performed at shop'),
                value: _performedAtShop,
                onChanged: _togglePerformedAtShop,
              ),
              if (_performedAtShop)
                TextFormField(
                  controller: _shopController,
                  decoration: const InputDecoration(labelText: 'Shop'),
                  validator: (value) {
                    if (_performedAtShop && (value == null || value.trim().isEmpty)) {
                      return 'Please enter shop name';
                    }
                    return null;
                  },
                ),
              const SizedBox(height: 24),
              ElevatedButton(
                onPressed: _submit,
                child: const Text('Save'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
